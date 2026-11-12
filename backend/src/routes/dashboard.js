const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/dashboard/management
router.get('/management', authenticate, requireManagement, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Sales metrics
    const todaySales = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: todayStart, lte: todayEnd },
        paymentStatus: 'COMPLETED',
      },
      _sum: { grandTotal: true, subtotal: true },
      _count: { id: true },
    });

    const monthlySales = await prisma.sale.aggregate({
      where: {
        saleDate: { gte: monthStart, lte: monthEnd },
        paymentStatus: 'COMPLETED',
      },
      _sum: { grandTotal: true, subtotal: true },
      _count: { id: true },
    });

    const totalSalesAllTime = await prisma.sale.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: { grandTotal: true, subtotal: true },
    });

    // 2. Purchases metrics
    const totalPurchases = await prisma.purchase.aggregate({
      _sum: { grandTotal: true, paidAmount: true, outstandingAmount: true },
      _count: { id: true },
    });

    // 3. Inventory calculation (variant-wise)
    const inventoryItems = await prisma.inventory.findMany({
      include: {
        variant: {
          include: {
            product: { include: { brand: true, category: true } },
            rackLocation: true,
          },
        },
      },
    });

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
      const buyPrice = inv.variant.purchasePrice || 0;
      const sellPrice = inv.variant.sellingPrice || 0;

      totalStockPairs += qty;
      totalInventoryValue += qty * buyPrice;
      totalSellingValue += qty * sellPrice;

      if (qty <= inv.minStockAlert) {
        lowStockCount++;
        if (lowStockItems.length < 8) {
          lowStockItems.push({
            id: inv.id,
            productName: inv.variant.product.name,
            brand: inv.variant.product.brand.name,
            size: inv.variant.size,
            colour: inv.variant.colour,
            quantity: qty,
            minStock: inv.minStockAlert,
            barcode: inv.variant.barcode,
          });
        }
      }

      const tier = inv.variant.clearanceTier;
      if (tier === 'AGEING' || tier === 'CLEARANCE_RECOMMENDED' || tier === 'DEEP_CLEARANCE') {
        ageingStockCount += qty;
        if (clearanceAlerts.length < 8) {
          clearanceAlerts.push({
            id: inv.variant.id,
            productName: inv.variant.product.name,
            brand: inv.variant.product.brand.name,
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

    const totalProducts = await prisma.product.count();

    // 4. Expenses
    const expensesAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    // 5. Cost of Goods Sold (COGS) for completed sales
    const saleItems = await prisma.saleItem.findMany({
      include: {
        variant: true,
        sale: true,
      },
      where: {
        sale: { paymentStatus: 'COMPLETED' },
      },
    });

    let totalCogs = 0;
    saleItems.forEach((item) => {
      totalCogs += item.quantity * (item.variant.purchasePrice || 0);
    });

    const totalRevenue = totalSalesAllTime._sum.grandTotal || 0;
    const grossProfit = Math.round(totalRevenue - totalCogs);
    const netProfit = Math.round(grossProfit - totalExpenses);

    // Outstanding payments to vendors
    const vendorsAgg = await prisma.vendor.aggregate({
      _sum: { outstandingAmount: true },
    });
    const outstandingPayments = vendorsAgg._sum.outstandingAmount || 0;

    // 6. Recent Transactions
    const recentTransactions = await prisma.sale.findMany({
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
    });

    // 7. Best Performing Sales Executives
    const salesExecs = await prisma.user.findMany({
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
    });

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

    // 8. Sales Performance Chart (Last 7 Days)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const daySales = await prisma.sale.aggregate({
        where: {
          saleDate: { gte: startOfDay, lte: endOfDay },
          paymentStatus: 'COMPLETED',
        },
        _sum: { grandTotal: true },
        _count: { id: true },
      });

      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      salesChart.push({
        date: label,
        amount: daySales._sum.grandTotal || 0,
        orders: daySales._count.id || 0,
      });
    }

    // 9. Top-selling products
    const productSalesMap = {};
    saleItems.forEach((si) => {
      const pName = si.variant.product?.name || 'Footwear';
      const pid = si.variant.productId;
      if (!productSalesMap[pid]) {
        productSalesMap[pid] = {
          name: pName,
          pairs: 0,
          revenue: 0,
        };
      }
      productSalesMap[pid].pairs += si.quantity;
      productSalesMap[pid].revenue += si.finalPrice;
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
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
    });
  } catch (error) {
    console.error('Management dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch management dashboard data' });
  }
});

// GET /api/dashboard/sales-exec
router.get('/sales-exec', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Today's sales by this salesperson
    const todaySales = await prisma.sale.findMany({
      where: {
        salesExecutiveId: userId,
        saleDate: { gte: todayStart, lte: todayEnd },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: true,
      },
    });

    let todayAmount = 0;
    let todayPairs = 0;
    todaySales.forEach((s) => {
      todayAmount += s.grandTotal;
      s.items.forEach((it) => (todayPairs += it.quantity));
    });

    // Month's sales by this salesperson
    const monthSales = await prisma.sale.findMany({
      where: {
        salesExecutiveId: userId,
        saleDate: { gte: monthStart, lte: monthEnd },
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: true,
      },
    });

    let monthAmount = 0;
    let monthPairs = 0;
    monthSales.forEach((s) => {
      monthAmount += s.grandTotal;
      s.items.forEach((it) => (monthPairs += it.quantity));
    });

    // Targets
    const dailyTarget = await prisma.salesTarget.findFirst({
      where: {
        userId,
        targetType: 'DAILY',
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const monthlyTarget = await prisma.salesTarget.findFirst({
      where: {
        userId,
        targetType: 'MONTHLY',
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const dailyTargetAmt = dailyTarget?.targetAmount || 15000;
    const monthlyTargetAmt = monthlyTarget?.targetAmount || 250000;

    const dailyAchievement = Math.round((todayAmount / dailyTargetAmt) * 100);
    const monthlyAchievement = Math.round((monthAmount / monthlyTargetAmt) * 100);

    // Recent sales transactions by this executive
    const recentSales = await prisma.sale.findMany({
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
    });

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
