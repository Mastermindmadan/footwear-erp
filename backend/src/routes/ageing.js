const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/ageing/summary - Stock age metrics & distribution
router.get('/summary', authenticate, async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      include: {
        product: { include: { brand: true, category: true } },
        inventory: true,
        rackLocation: {
          include: {
            shelf: {
              include: { rack: true },
            },
          },
        },
      },
    });

    const now = new Date();
    const tiers = {
      FRESH: { name: 'Fresh (0-30 days)', minDays: 0, maxDays: 30, count: 0, pairs: 0, value: 0, items: [] },
      NORMAL: { name: 'Normal (31-60 days)', minDays: 31, maxDays: 60, count: 0, pairs: 0, value: 0, items: [] },
      AGEING: { name: 'Ageing (61-90 days)', minDays: 61, maxDays: 90, count: 0, pairs: 0, value: 0, items: [] },
      CLEARANCE_RECOMMENDED: {
        name: 'Clearance Recommended (91-120 days)',
        minDays: 91,
        maxDays: 120,
        count: 0,
        pairs: 0,
        value: 0,
        items: [],
      },
      DEEP_CLEARANCE: {
        name: 'Deep Clearance (121-180 days)',
        minDays: 121,
        maxDays: 180,
        count: 0,
        pairs: 0,
        value: 0,
        items: [],
      },
      DEAD_STOCK: {
        name: 'Dead / Critical Stock (180+ days)',
        minDays: 181,
        maxDays: 9999,
        count: 0,
        pairs: 0,
        value: 0,
        items: [],
      },
    };

    variants.forEach((v) => {
      const entryTime = new Date(v.entryDate).getTime();
      const ageDays = Math.floor((now.getTime() - entryTime) / (1000 * 60 * 60 * 24));
      const qty = v.inventory ? v.inventory.quantity : 0;
      const val = qty * v.sellingPrice;

      let tierKey = 'FRESH';
      if (ageDays > 180) tierKey = 'DEAD_STOCK';
      else if (ageDays > 120) tierKey = 'DEEP_CLEARANCE';
      else if (ageDays > 90) tierKey = 'CLEARANCE_RECOMMENDED';
      else if (ageDays > 60) tierKey = 'AGEING';
      else if (ageDays > 30) tierKey = 'NORMAL';

      tiers[tierKey].count++;
      tiers[tierKey].pairs += qty;
      tiers[tierKey].value += val;

      tiers[tierKey].items.push({
        id: v.id,
        productName: v.product.name,
        articleNumber: v.product.articleNumber,
        brand: v.product.brand.name,
        category: v.product.category.name,
        size: v.size,
        colour: v.colour,
        barcode: v.barcode,
        ageDays,
        quantity: qty,
        mrp: v.mrp,
        sellingPrice: v.sellingPrice,
        purchasePrice: v.purchasePrice,
        clearanceDiscount: v.clearanceDiscount,
        clearanceStatus: v.clearanceStatus,
        clearanceApproved: v.clearanceApproved,
        rackCode: v.rackLocation ? v.rackLocation.shelf.rack.code : 'None',
      });
    });

    res.json({ tiers });
  } catch (error) {
    console.error('Ageing summary error:', error);
    res.status(500).json({ error: 'Failed to fetch ageing analysis' });
  }
});

// POST /api/ageing/action - Update clearance tier, discount, or move to clearance rack
router.post('/action', authenticate, requireManagement, async (req, res) => {
  try {
    const { variantId, action, discountPercent, newRackType } = req.body;
    // action: "APPROVE_20", "APPROVE_50", "REJECT", "MOVE_RACK", "CUSTOM_DISCOUNT"

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const updateData = {};

    if (action === 'APPROVE_20') {
      updateData.clearanceStatus = 'ASSORTED_RACK';
      updateData.clearanceDiscount = 20;
      updateData.clearanceApproved = true;
    } else if (action === 'APPROVE_50') {
      updateData.clearanceStatus = 'DEEP_DISCOUNT_RACK';
      updateData.clearanceDiscount = 50;
      updateData.clearanceApproved = true;
    } else if (action === 'CUSTOM_DISCOUNT') {
      updateData.clearanceDiscount = parseFloat(discountPercent || 0);
      updateData.clearanceApproved = true;
      if (updateData.clearanceDiscount >= 40) {
        updateData.clearanceStatus = 'DEEP_DISCOUNT_RACK';
      } else if (updateData.clearanceDiscount > 0) {
        updateData.clearanceStatus = 'ASSORTED_RACK';
      }
    } else if (action === 'REJECT') {
      updateData.clearanceApproved = false;
      updateData.clearanceDiscount = 0;
      updateData.clearanceStatus = 'NORMAL_RACK';
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    res.json({ message: 'Clearance action updated successfully', variant: updated });
  } catch (error) {
    console.error('Ageing action error:', error);
    res.status(500).json({ error: 'Failed to apply clearance action' });
  }
});

module.exports = router;
