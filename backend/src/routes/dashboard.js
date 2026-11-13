const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// Short in-memory cache
let mgtCache = null;
let mgtCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

// GET /api/dashboard/management
router.get('/management', authenticate, requireManagement, async (req, res) => {
  try {
    const nowMs = Date.now();
    if (mgtCache && nowMs - mgtCacheTime < CACHE_TTL_MS) {
      return res.json(mgtCache);
    }

    const nowDate = new Date();
    const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0);
    const todayEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 23, 59, 59);

    const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1, 0, 0, 0);
    const sevenDaysAgo = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 6, 0, 0, 0);
    const earliestSalesDate = monthStart < sevenDaysAgo ? monthStart : sevenDaysAgo;

    // Run only 6 focused queries concurrently instead of 18 serial ones
    const [
      totalSalesAllTime,
      recentCompletedSales,
      totalPurchases,
      inventoryItems,
      totalProducts,
      expensesAgg,
      vendorsAgg,
      recentTransactions,
      salesExecs,
    ] = await Promise.all([
      // 1. All-time completed sales totals
      prisma.sale.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { grandTotal: true, subtotal: true },
      }),

      // 2. All sales since earliest date with items in ONE query (computes today, monthly, 7-day chart, COGS & top products)
      prisma.sale.findMany({
        where: {
          paymentStatus: 'COMPLETED',
          saleDate: { gte: earliestSalesDate },
        },
        select: {
          id: true,
          grandTotal: true,
          saleDate: true,
          salesExecutiveId: true,
          items: {
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
          },
        },
      }),

      // 3. Purchases
      prisma.purchase.aggregate({
        _sum: { grandTotal: true, paidAmount: true, outstandingAmount: true },
        _count: { id: true },
      }),

      // 4. Inventory items (lean select)
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

      // 5. Total product count
      prisma.product.count(),

      // 6. Expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),

      // 7. Vendors outstanding
      prisma.vendor.aggregate({
        _sum: { outstandingAmount: true },
      }),

      // 8. Recent 8 transactions
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

      // 9. Sales executives list with monthly target
      prisma.user.findMany({
        where: { role: 'SALES_EXECUTIVE', active: true },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          salesTargets: {
            where: { targetType: 'MONTHLY' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { targetAmount: true },
          },
        },
      }),
    ]);

    // Compute sales metrics in memory
    let todaySalesTotal = 0;
    let todayOrdersCount = 0;
    let monthlySalesTotal = 0;
    let monthlyOrdersCount = 0;
    let totalCogs = 0;
    const productSalesMap = {};
    const execSalesMap = {};

    // Initialize 7-day buckets
    const dayBuckets = {};
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dayBuckets[key] = { date: label, amount: 0, orders: 0 };
      dayLabels.push(key);
    }

    recentCompletedSales.forEach((sale) => {
      const sDate = new Date(sale.saleDate);
      const amount = sale.grandTotal || 0;

      // Check today
      if (sDate >= todayStart && sDate <= todayEnd) {
        todaySalesTotal += amount;
        todayOrdersCount++;
      }

      // Check month
      if (sDate >= monthStart) {
        monthlySalesTotal += amount;
        monthlyOrdersCount++;
      }

      // Check 7-day chart bucket
      const dayKey = `${sDate.getFullYear()}-${sDate.getMonth()}-${sDate.getDate()}`;
      if (dayBuckets[dayKey]) {
        dayBuckets[dayKey].amount += amount;
        dayBuckets[dayKey].orders++;
      }

      // Exec sales tracking
      if (sale.salesExecutiveId) {
        if (!execSalesMap[sale.salesExecutiveId]) {
          execSalesMap[sale.salesExecutiveId] = { totalSales: 0, totalPairs: 0 };
        }
        execSalesMap[sale.salesExecutiveId].totalSales += amount;
        sale.items.forEach((it) => {
          execSalesMap[sale.salesExecutiveId].totalPairs += it.quantity;
        });
      }

      // COGS & Top products
      sale.items.forEach((item) => {
        totalCogs += item.quantity * (item.variant?.purchasePrice || 0);
        const pName = item.variant?.product?.name || 'Footwear';
        const pid = item.variant?.productId || 'unknown';
        if (!productSalesMap[pid]) {
          productSalesMap[pid] = { name: pName, pairs: 0, revenue: 0 };
        }
        productSalesMap[pid].pairs += item.quantity;
        productSalesMap[pid].revenue += item.finalPrice;
      });
    });

    const salesChart = dayLabels.map((key) => dayBuckets[key]);

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

    const totalRevenue = totalSalesAllTime._sum.grandTotal || 0;
    const totalExpenses = expensesAgg._sum.amount || 0;
    const grossProfit = Math.round(totalRevenue - totalCogs);
    const netProfit = Math.round(grossProfit - totalExpenses);
    const outstandingPayments = vendorsAgg._sum.outstandingAmount || 0;

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const bestExecutives = salesExecs.map((exec) => {
      const stats = execSalesMap[exec.id] || { totalSales: 0, totalPairs: 0 };
      const currentTarget = exec.salesTargets[0]?.targetAmount || 100000;
      const targetAchievement = Math.round((stats.totalSales / currentTarget) * 100);

      return {
        id: exec.id,
        name: exec.name,
        email: exec.email,
        avatar: exec.avatar,
        totalSales: Math.round(stats.totalSales),
        totalPairs: stats.totalPairs,
        targetAmount: currentTarget,
        targetAchievement,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    const responsePayload = {
      summary: {
        todaySales: todaySalesTotal,
        todayOrders: todayOrdersCount,
        monthlySales: monthlySalesTotal,
        monthlyOrders: monthlyOrdersCount,
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
