const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/damaged - List damaged goods
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const damagedList = await prisma.damagedProduct.findMany({
      where,
      include: {
        variant: {
          include: {
            product: { include: { brand: true, category: true } },
            inventory: true,
          },
        },
        responsibleUser: { select: { id: true, name: true, role: true } },
      },
      orderBy: { damageDate: 'desc' },
    });

    res.json({ damagedList });
  } catch (error) {
    console.error('Damaged goods fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch damaged goods' });
  }
});

// POST /api/damaged - Register damaged footwear
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      variantId,
      damageType,
      quantity = 1,
      responsibleUserId,
      estimatedRepairCost = 0,
      expectedCorrectionDate,
      notes,
    } = req.body;

    if (!variantId || !damageType) {
      return res.status(400).json({ error: 'variantId and damageType are required' });
    }

    const qty = parseInt(quantity, 10);

    const record = await prisma.$transaction(async (tx) => {
      // 1. Create damaged product record
      const damaged = await tx.damagedProduct.create({
        data: {
          variantId,
          damageType,
          quantity: qty,
          damageDate: new Date(),
          responsibleUserId: responsibleUserId || req.user.id,
          status: 'DAMAGED',
          estimatedRepairCost: parseFloat(estimatedRepairCost || 0),
          expectedCorrectionDate: expectedCorrectionDate ? new Date(expectedCorrectionDate) : null,
          notes,
        },
      });

      // 2. Decrement active inventory
      const inventory = await tx.inventory.findUnique({ where: { variantId } });
      if (inventory) {
        const prev = inventory.quantity;
        const next = Math.max(0, prev - qty);
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: next, lastStockUpdate: new Date() },
        });

        await tx.stockMovement.create({
          data: {
            variantId,
            type: 'DAMAGE_OUT',
            quantity: qty,
            previousQty: prev,
            newQty: next,
            reason: `Damaged item logged (${damageType})`,
            referenceId: damaged.id,
            userId: req.user.id,
          },
        });
      }

      return damaged;
    });

    res.status(201).json({ message: 'Damaged item recorded and removed from active stock', record });
  } catch (error) {
    console.error('Register damaged error:', error);
    res.status(500).json({ error: 'Failed to record damaged item' });
  }
});

// PUT /api/damaged/:id - Update status and repair costs
router.put('/:id', authenticate, requireManagement, async (req, res) => {
  try {
    const { status, actualRepairCost, estimatedRepairCost, expectedCorrectionDate, disposalDetails, notes } = req.body;

    const existing = await prisma.damagedProduct.findUnique({
      where: { id: req.params.id },
      include: { variant: { include: { inventory: true } } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Damaged record not found' });
    }

    const previousStatus = existing.status;
    const targetStatus = status || previousStatus;

    await prisma.$transaction(async (tx) => {
      await tx.damagedProduct.update({
        where: { id: req.params.id },
        data: {
          status: targetStatus,
          actualRepairCost: actualRepairCost !== undefined ? parseFloat(actualRepairCost) : existing.actualRepairCost,
          estimatedRepairCost: estimatedRepairCost !== undefined ? parseFloat(estimatedRepairCost) : existing.estimatedRepairCost,
          expectedCorrectionDate: expectedCorrectionDate ? new Date(expectedCorrectionDate) : existing.expectedCorrectionDate,
          disposalDetails: disposalDetails !== undefined ? disposalDetails : existing.disposalDetails,
          notes: notes !== undefined ? notes : existing.notes,
        },
      });

      // If status changed to RETURNED_TO_STOCK, add back to inventory!
      if (targetStatus === 'RETURNED_TO_STOCK' && previousStatus !== 'RETURNED_TO_STOCK') {
        const inventory = existing.variant.inventory;
        if (inventory) {
          const prev = inventory.quantity;
          const next = prev + existing.quantity;
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: next, lastStockUpdate: new Date() },
          });

          await tx.stockMovement.create({
            data: {
              variantId: existing.variantId,
              type: 'REPAIR_IN',
              quantity: existing.quantity,
              previousQty: prev,
              newQty: next,
              reason: 'Repaired item restored back into active inventory',
              referenceId: existing.id,
              userId: req.user.id,
            },
          });
        }
      }
    });

    res.json({ message: 'Damaged product status updated successfully' });
  } catch (error) {
    console.error('Update damaged error:', error);
    res.status(500).json({ error: 'Failed to update damaged item' });
  }
});

module.exports = router;
