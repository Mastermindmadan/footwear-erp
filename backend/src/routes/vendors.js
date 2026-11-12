const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/vendors - List vendors
router.get('/', authenticate, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ vendors });
  } catch (error) {
    console.error('Vendors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/vendors - Add vendor (Management Only)
router.post('/', authenticate, requireManagement, async (req, res) => {
  try {
    const { name, code, contactPerson, phone, email, address, gstin, creditPeriodDays } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Vendor name and phone are required' });
    }

    const vendorCode = code || `VND-${name.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-3)}`;

    const vendor = await prisma.vendor.create({
      data: {
        name,
        code: vendorCode,
        contactPerson,
        phone,
        email,
        address,
        gstin,
        creditPeriodDays: parseInt(creditPeriodDays || 30, 10),
      },
    });

    res.status(201).json({ message: 'Vendor added successfully', vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// POST /api/vendors/:id/pay - Record vendor payment
router.post('/:id/pay', authenticate, requireManagement, async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const newOutstanding = Math.max(0, vendor.outstandingAmount - payAmt);
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { outstandingAmount: newOutstanding },
    });

    res.json({
      message: `Payment of ₹${payAmt.toLocaleString()} recorded. Remaining outstanding: ₹${newOutstanding.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Vendor pay error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

module.exports = router;
