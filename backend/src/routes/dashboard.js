const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// Simple short-lived in-memory cache to prevent redundant cross-continental DB roundtrips
let mgtCache = null;
let mgtCacheTime = 0;
const CACHE_TTL_MS = 20000; // 20 seconds cache

// GET /api/dashboard/management
router.get('/management', authenticate, requireManagement, async (req, res) => {
  try {
    const now = Date.now();
    if (mgtCache && now - mgtCacheTime < CACHE_TTL_MS) {
      return res.json(mgtCache);
    }

    const nowDate = new Date();
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0);
    const todayEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59);

    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

    // Prepare 7-day sales promises in parallel
    const dayPromises = [];
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      dayPromises.push(
        prisma.sale.aggregate({
          where: {
            saleDate: { gte: startOfDay, lte: endOfDay },
            paymentStatus: 'COMPLETED',
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        })
      );
    }

    // Execute ALL database queries in parallel with Promise.all
    const [
      todaySales,
      monthlySales,
      totalSalesAllTime,
      totalPurchases,
      inventoryItems,
      totalProducts,
      expensesAgg,
      saleItems,
      vendorsAgg,
      recentTransactions,
      salesExecs,
      ...dailySalesResults
    ] = await Promise.all([
      // 1. Sales metrics
      prisma.sale.aggregate({
        where: {
          saleDate: { gte: todayStart, lte: todayEnd },
          paymentStatus: 'COMPLETED',
        },
        _sum: { grandTotal: true, subtotal: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: {
          saleDate: { gte: monthStart, lte: monthEnd },
          paymentStatus: 'COMPLETED',
        },
        _sum: { grandTotal: true, subtotal: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { grandTotal: true, subtotal: true },
      }),
      // 2. Purchases metrics
      prisma.purchase.aggregate({
        _sum: { grandTotal: true, paidAmount: true, outstandingAmount: true },
        _count: { id: true },
      }),
      // 3. Inventory calculation
      prisma.inventory.findMany({
        select: {
          id: true,
          quantity: true,
          minStockAlert: true,
          variant: {
            select: {
              id: true,
              size: true,
              colour: true,
              barcode: true,
              purchasePrice: true,
              sellingPrice: true,
              clearanceTier: true,
              clearanceDiscount: true,
              clearanceStatus: true,
              product: {
                select: {
                  name: true,
                  brand: { select: { name: true } },
                  category: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      // 4. Total products
      prisma.product.count(),
      // 5. Expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      // 6. Cost of goods sold & top products
      prisma.saleItem.findMany({
        where: {
          sale: { paymentStatus: 'COMPLETED' },
        },
        select: {
          quantity: true,
          finalPrice: true,
          variant: {
            select: {
              productId: true,
              purchasePrice: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      // 7. Vendors outstanding
      prisma.vendor.aggregate({
        _sum: { outstandingAmount: true },
      }),
      // 8. Recent transactions
      prisma.sale.findMany({
        take: 8,
        orderBy: { saleDate: 'desc' },
        include: {
          customer: true,
          salesExecutive: { select: { name: true, email: true } },
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      }),
      // 9. Best performing sales executives
      prisma.user.findMany({
        where: { role: 'SALES_EXECUTIVE', active: true },
        include: {
          sales: {
            where: { paymentStatus: 'COMPLETED' },
            select: { grandTotal: true, saleDate: true, items: { select: { quantity: true } } },
          },
          salesTargets: {
            where: { targetType: 'MONTHLY' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      // 10. Daily sales chart queries
      ...dayPromises,
    ]);

    // Process inventory
    let totalInventoryValue = 0;
    let totalSellingValue = 0;
    let totalStockPairs = 0;
    let lowStockCount = 0;
    let ageingStockCount = 0;
    let deadStockCount = 0;
    const lowStockItems = [];
    const clearanceAlerts = [];

    inventoryItems.forEach((inv) => {
      const qty = inv.quantity;
      const buyPrice = inv.variant?.purchasePrice || 0;
      const sellPrice = inv.variant?.sellingPrice || 0;

      totalStockPairs += qty;
      totalInventoryValue += qty * buyPrice;
      totalSellingValue += qty * sellPrice;

      if (qty <= inv.minStockAlert) {
        lowStockCount++;
        if (lowStockItems.length < 8 && inv.variant?.product) {
          lowStockItems.push({
            id: inv.id,
            productName: inv.variant.product.name,
            brand: inv.variant.product.brand?.name || 'SoleFit',
            size: inv.variant.size,
            colour: inv.variant.colour,
            quantity: qty,
            minStock: inv.minStockAlert,
            barcode: inv.variant.barcode,
          });
        }
      }

      const tier = inv.variant?.clearanceTier;
      if (tier === 'AGEING' || tier === 'CLEARANCE_RECOMMENDED' || tier === 'DEEP_CLEARANCE') {
        ageingStockCount += qty;
        if (clearanceAlerts.length < 8 && inv.variant?.product) {
          clearanceAlerts.push({
            id: inv.variant.id,
            productName: inv.variant.product.name,
            brand: inv.variant.product.brand?.name || 'SoleFit',
            size: inv.variant.size,
            colour: inv.variant.colour,
            tier: inv.variant.clearanceTier,
            discount: inv.variant.clearanceDiscount,
            status: inv.variant.clearanceStatus,
            quantity: qty,
          });
        }
      } else if (tier === 'DEAD_STOCK') {
        deadStockCount += qty;
      }
    });

    // Process COGS
    let totalCogs = 0;
    const productSalesMap = {};
    saleItems.forEach((item) => {
      totalCogs += item.quantity * (item.variant?.purchasePrice || 0);

      const pName = item.variant?.product?.name || 'Footwear';
      const pid = item.variant?.productId || 'unknown';
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = { name: pName, pairs: 0, revenue: 0 };
      }
      productSalesMap[pid].pairs += item.quantity;
      productSalesMap[pid].revenue += item.finalPrice;
    });

    const totalRevenue = totalSalesAllTime._sum.grandTotal || 0;
    const totalExpenses = expensesAgg._sum.amount || 0;
    const grossProfit = Math.round(totalRevenue - totalCogs);
    const netProfit = Math.round(grossProfit - totalExpenses);
    const outstandingPayments = vendorsAgg._sum.outstandingAmount || 0;

    // Process top selling products
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Process best executives
    const bestExecutives = salesExecs.map((exec) => {
      let totalAmount = 0;
      let totalPairs = 0;
      exec.sales.forEach((s) => {
        totalAmount += s.grandTotal;
        s.items.forEach((it) => (totalPairs += it.quantity));
      });

      const currentTarget = exec.salesTargets[0]?.targetAmount || 100000;
      const targetAchievement = Math.round((totalAmount / currentTarget) * 100);

      return {
        id: exec.id,
        name: exec.name,
        email: exec.email,
        avatar: exec.avatar,
        totalSales: Math.round(totalAmount),
        totalPairs,
        targetAmount: currentTarget,
        targetAchievement,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    // Build sales chart from parallel results
    const salesChart = dayLabels.map((label, idx) => ({
      date: label,
      amount: dailySalesResults[idx]?._sum?.grandTotal || 0,
      orders: dailySalesResults[idx]?._count?.id || 0,
    }));

    const responsePayload = {
      summary: {
        todaySales: todaySales._sum.grandTotal || 0,
        todayOrders: todaySales._count.id || 0,
        monthlySales: monthlySales._sum.grandTotal || 0,
        monthlyOrders: monthlySales._count.id || 0,
        totalPurchases: totalPurchases._sum.grandTotal || 0,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalSellingValue: Math.round(totalSellingValue),
        totalProducts,
        totalStockPairs,
        lowStockCount,
        ageingStockCount,
        deadStockCount,
        grossProfit,
        netProfit,
        totalExpenses,
        outstandingPayments,
      },
      salesChart,
      topSellingProducts,
      bestExecutives,
      recentTransactions,
      lowStockItems,
      clearanceAlerts,
    };

    // Store in cache
    mgtCache = responsePayload;
    mgtCacheTime = Date.now();

    res.json(responsePayload);
  } catch (error) {
    console.error('Management dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch management dashboard data' });
  }
});

// GET /api/dashboard/sales-exec
router.get('/sales-exec', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const nowDate = new Date();
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0);
    const todayEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59);

    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

    // Parallelize all queries for sales executive dashboard
    const [todaySales, monthSales, dailyTarget, monthlyTarget, recentSales] = await Promise.all([
      prisma.sale.findMany({
        where: {
          salesExecutiveId: userId,
          saleDate: { gte: todayStart, lte: todayEnd },
          paymentStatus: 'COMPLETED',
        },
        select: {
          grandTotal: true,
          items: { select: { quantity: true } },
        },
      }),
      prisma.sale.findMany({
        where: {
          salesExecutiveId: userId,
          saleDate: { gte: monthStart, lte: monthEnd },
          paymentStatus: 'COMPLETED',
        },
        select: {
          grandTotal: true,
          items: { select: { quantity: true } },
        },
      }),
      prisma.salesTarget.findFirst({
        where: {
          userId,
          targetType: 'DAILY',
          startDate: { lte: nowDate },
          endDate: { gte: nowDate },
        },
      }),
      prisma.salesTarget.findFirst({
        where: {
          userId,
          targetType: 'MONTHLY',
          startDate: { lte: nowDate },
          endDate: { gte: nowDate },
        },
      }),
      prisma.sale.findMany({
        where: { salesExecutiveId: userId },
        take: 6,
        orderBy: { saleDate: 'desc' },
        include: {
          customer: true,
          items: {
            include: {
              variant: {
                include: {
                  product: { include: { brand: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    let todayAmount = 0;
    let todayPairs = 0;
    todaySales.forEach((s) => {
      todayAmount += s.grandTotal;
      s.items.forEach((it) => (todayPairs += it.quantity));
    });

    let monthAmount = 0;
    let monthPairs = 0;
    monthSales.forEach((s) => {
      monthAmount += s.grandTotal;
      s.items.forEach((it) => (monthPairs += it.quantity));
    });

    const dailyTargetAmt = dailyTarget?.targetAmount || 15000;
    const monthlyTargetAmt = monthlyTarget?.targetAmount || 250000;

    const dailyAchievement = Math.round((todayAmount / dailyTargetAmt) * 100);
    const monthlyAchievement = Math.round((monthAmount / monthlyTargetAmt) * 100);

    res.json({
      todaySales: todayAmount,
      todayBills: todaySales.length,
      todayProductsSold: todayPairs,
      monthSales: monthAmount,
      monthBills: monthSales.length,
      monthProductsSold: monthPairs,
      dailyTarget: dailyTargetAmt,
      dailyAchievement,
      monthlyTarget: monthlyTargetAmt,
      monthlyAchievement,
      recentSales,
    });
  } catch (error) {
    console.error('Sales executive dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch sales executive dashboard data' });
  }
});

module.exports = router;

module.exports = router;
