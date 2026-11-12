const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/financials/overview - P&L and Balance
router.get('/overview', authenticate, requireManagement, async (req, res) => {
  try {
    // 1. Total Revenue
    const salesAgg = await prisma.sale.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: { grandTotal: true, subtotal: true, taxAmount: true, cashAmount: true, upiAmount: true, cardAmount: true },
    });

    const totalRevenue = salesAgg._sum.grandTotal || 0;
    const cashCollected = salesAgg._sum.cashAmount || 0;
    const upiCollected = salesAgg._sum.upiAmount || 0;
    const cardCollected = salesAgg._sum.cardAmount || 0;

    // 2. COGS (Cost of Goods Sold)
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { paymentStatus: 'COMPLETED' } },
      include: { variant: true },
    });

    let totalCogs = 0;
    saleItems.forEach((si) => {
      totalCogs += si.quantity * (si.variant.purchasePrice || 0);
    });

    const grossProfit = Math.round(totalRevenue - totalCogs);
    const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

    // 3. Expenses
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    });

    let totalExpenses = 0;
    const expensesByCategory = {};
    expenses.forEach((e) => {
      totalExpenses += e.amount;
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    const netProfit = Math.round(grossProfit - totalExpenses);
    const netMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // 4. Payables (Vendor Outstandings)
    const vendorsAgg = await prisma.vendor.aggregate({
      _sum: { outstandingAmount: true },
    });
    const totalPayables = vendorsAgg._sum.outstandingAmount || 0;

    // 5. Receivables (Customer pending if any, or default 0 for retail)
    const totalReceivables = 0;

    // 6. Cash and Bank Balances
    // Cash balance = Cash sales - Cash expenses
    const cashExpenses = expenses.filter((e) => e.paymentMethod === 'CASH').reduce((a, b) => a + b.amount, 0);
    const bankExpenses = totalExpenses - cashExpenses;

    const estimatedCashBalance = Math.max(15000, cashCollected - cashExpenses + 25000); // float cash reserve
    const estimatedBankBalance = Math.max(50000, upiCollected + cardCollected - bankExpenses + 150000);

    res.json({
      revenue: totalRevenue,
      cogs: Math.round(totalCogs),
      grossProfit,
      grossMarginPct,
      expenses: totalExpenses,
      expensesByCategory,
      netProfit,
      netMarginPct,
      payables: totalPayables,
      receivables: totalReceivables,
      cashBalance: Math.round(estimatedCashBalance),
      bankBalance: Math.round(estimatedBankBalance),
      recentExpenses: expenses.slice(0, 10),
    });
  } catch (error) {
    console.error('Financials overview error:', error);
    res.status(500).json({ error: 'Failed to fetch financial overview' });
  }
});

// GET /api/financials/capital - Capital & Equity breakdown
router.get('/capital', authenticate, requireManagement, async (req, res) => {
  try {
    const records = await prisma.capitalRecord.findMany({
      orderBy: { date: 'asc' },
    });

    let initialInvestment = 0;
    let additionalInvestment = 0;
    let withdrawals = 0;

    records.forEach((r) => {
      if (r.type === 'INITIAL_INVESTMENT') initialInvestment += r.amount;
      else if (r.type === 'ADDITIONAL_INVESTMENT') additionalInvestment += r.amount;
      else if (r.type === 'WITHDRAWAL') withdrawals += r.amount;
    });

    const totalCapitalInvested = initialInvestment + additionalInvestment;
    const currentCapitalBalance = totalCapitalInvested - withdrawals;

    res.json({
      initialInvestment,
      additionalInvestment,
      totalCapital: totalCapitalInvested,
      withdrawals,
      currentCapitalBalance,
      records,
    });
  } catch (error) {
    console.error('Capital overview error:', error);
    res.status(500).json({ error: 'Failed to fetch capital details' });
  }
});

// POST /api/financials/expense - Add store expense
router.post('/expense', authenticate, requireManagement, async (req, res) => {
  try {
    const { category, title, amount, paymentMethod, notes } = req.body;
    if (!category || !title || !amount) {
      return res.status(400).json({ error: 'Category, title, and amount are required' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        title,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        notes,
      },
    });

    res.status(201).json({ message: 'Expense added successfully', expense });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// POST /api/financials/capital - Add capital transaction
router.post('/capital', authenticate, requireManagement, async (req, res) => {
  try {
    const { type, amount, source, description, date } = req.body;
    if (!type || !amount || !source) {
      return res.status(400).json({ error: 'Type, amount, and source are required' });
    }

    const record = await prisma.capitalRecord.create({
      data: {
        type,
        amount: parseFloat(amount),
        source,
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json({ message: 'Capital record added successfully', record });
  } catch (error) {
    console.error('Add capital error:', error);
    res.status(500).json({ error: 'Failed to record capital transaction' });
  }
});

module.exports = router;
