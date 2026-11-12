const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/settings - Store configuration & staff list
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await prisma.storeSetting.findFirst();
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          storeName: 'SoleFit Premium Footwear Store',
          tagline: 'Step into Comfort & Elegance',
          phone: '+91 98450 12345',
          email: 'store@solefitfootwear.com',
          address: 'Plot #42, Commercial Street, Shivajinagar, Bangalore, Karnataka - 560001',
          gstin: '29AABCS1429B1Z8',
          footwearGstThreshold: 1000,
          lowGstPercent: 5,
          highGstPercent: 12,
          currencySymbol: '₹',
        },
      });
    }

    const staff = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' },
    });

    res.json({ settings, staff });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update store configuration (Management Only)
router.put('/', authenticate, requireManagement, async (req, res) => {
  try {
    const { storeName, tagline, phone, email, address, gstin, footwearGstThreshold, lowGstPercent, highGstPercent, currencySymbol } = req.body;

    const existing = await prisma.storeSetting.findFirst();
    let updated;

    if (existing) {
      updated = await prisma.storeSetting.update({
        where: { id: existing.id },
        data: {
          storeName,
          tagline,
          phone,
          email,
          address,
          gstin,
          footwearGstThreshold: parseFloat(footwearGstThreshold || 1000),
          lowGstPercent: parseFloat(lowGstPercent || 5),
          highGstPercent: parseFloat(highGstPercent || 12),
          currencySymbol: currencySymbol || '₹',
        },
      });
    } else {
      updated = await prisma.storeSetting.create({
        data: {
          storeName,
          tagline,
          phone,
          email,
          address,
          gstin,
          footwearGstThreshold: parseFloat(footwearGstThreshold || 1000),
          lowGstPercent: parseFloat(lowGstPercent || 5),
          highGstPercent: parseFloat(highGstPercent || 12),
          currencySymbol: currencySymbol || '₹',
        },
      });
    }

    res.json({ message: 'Store settings updated successfully', settings: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
});

module.exports = router;
