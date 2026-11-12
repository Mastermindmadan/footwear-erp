const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/targets - Sales targets & employee comparison
router.get('/', authenticate, async (req, res) => {
  try {
    const { type = 'MONTHLY' } = req.query; // 'DAILY' or 'MONTHLY'
    const now = new Date();

    const employees = await prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE', active: true },
      include: {
        salesTargets: {
          where: {
            targetType: type,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Also calculate actual sales in the target period directly from DB for 100% precision
    let periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    let periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (type === 'DAILY') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    const targetsComparison = await Promise.all(
      employees.map(async (emp) => {
        const target = emp.salesTargets[0];
        const targetAmount = target ? target.targetAmount : type === 'DAILY' ? 15000 : 250000;
        const targetPairs = target ? target.targetPairs : type === 'DAILY' ? 4 : 50;

        // Actual sales in this period
        const actualSales = await prisma.sale.aggregate({
          where: {
            salesExecutiveId: emp.id,
            saleDate: { gte: periodStart, lte: periodEnd },
            paymentStatus: 'COMPLETED',
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });

        const saleItems = await prisma.saleItem.findMany({
          where: {
            sale: {
              salesExecutiveId: emp.id,
              saleDate: { gte: periodStart, lte: periodEnd },
              paymentStatus: 'COMPLETED',
            },
          },
          select: { quantity: true },
        });

        const achievedPairs = saleItems.reduce((acc, it) => acc + it.quantity, 0);
        const achievedAmount = actualSales._sum.grandTotal || 0;
        const remainingAmount = Math.max(0, targetAmount - achievedAmount);
        const achievementPct = targetAmount > 0 ? Math.min(100, Math.round((achievedAmount / targetAmount) * 100)) : 0;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          email: emp.email,
          avatar: emp.avatar,
          targetId: target?.id,
          targetType: type,
          targetAmount,
          targetPairs,
          achievedAmount,
          achievedPairs,
          remainingAmount,
          achievementPct,
          billsCount: actualSales._count.id || 0,
        };
      })
    );

    res.json({
      period: type,
      periodStart,
      periodEnd,
      targets: targetsComparison,
    });
  } catch (error) {
    console.error('Targets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sales targets' });
  }
});

// POST /api/targets - Set/Update Target (Management Only)
router.post('/', authenticate, requireManagement, async (req, res) => {
  try {
    const { userId, targetType = 'MONTHLY', targetAmount, targetPairs } = req.body;

    if (!userId || !targetAmount) {
      return res.status(400).json({ error: 'userId and targetAmount are required' });
    }

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (targetType === 'DAILY') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }

    // Check if an existing target exists in this date window
    const existing = await prisma.salesTarget.findFirst({
      where: {
        userId,
        targetType,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    let target;
    if (existing) {
      target = await prisma.salesTarget.update({
        where: { id: existing.id },
        data: {
          targetAmount: parseFloat(targetAmount),
          targetPairs: parseInt(targetPairs || 0, 10),
        },
      });
    } else {
      target = await prisma.salesTarget.create({
        data: {
          userId,
          targetType,
          startDate,
          endDate,
          targetAmount: parseFloat(targetAmount),
          targetPairs: parseInt(targetPairs || 0, 10),
        },
      });
    }

    res.json({ message: 'Target saved successfully', target });
  } catch (error) {
    console.error('Save target error:', error);
    res.status(500).json({ error: 'Failed to set target' });
  }
});

module.exports = router;
