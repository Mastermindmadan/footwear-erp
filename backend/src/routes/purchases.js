const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/purchases - List purchases with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { vendorId, paymentStatus, search } = req.query;
    const where = {};

    if (vendorId) where.vendorId = vendorId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { vendor: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        vendor: true,
        createdBy: { select: { name: true } },
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    res.json({ purchases });
  } catch (error) {
    console.error('Purchases fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// POST /api/purchases - Inward purchase consignment (Management Only)
router.post('/', authenticate, requireManagement, async (req, res) => {
  try {
    const {
      invoiceNumber,
      vendorId,
      purchaseDate,
      items, // array of { variantId, quantity, unitCost }
      totalAmount,
      taxAmount = 0,
      discountAmount = 0,
      paidAmount = 0,
      notes,
    } = req.body;

    if (!invoiceNumber || !vendorId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invoice number, vendor, and items are required' });
    }

    const grandTotal = parseFloat(totalAmount) + parseFloat(taxAmount || 0) - parseFloat(discountAmount || 0);
    const paid = parseFloat(paidAmount || 0);
    const outstanding = Math.max(0, grandTotal - paid);

    let status = 'UNPAID';
    if (paid >= grandTotal) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';

    const purchase = await prisma.$transaction(async (tx) => {
      const pur = await tx.purchase.create({
        data: {
          invoiceNumber,
          vendorId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount: parseFloat(totalAmount),
          taxAmount: parseFloat(taxAmount || 0),
          discountAmount: parseFloat(discountAmount || 0),
          grandTotal,
          paymentStatus: status,
          paidAmount: paid,
          outstandingAmount: outstanding,
          notes,
          createdById: req.user.id,
        },
      });

      for (const it of items) {
        const qty = parseInt(it.quantity, 10);
        const cost = parseFloat(it.unitCost);

        await tx.purchaseItem.create({
          data: {
            purchaseId: pur.id,
            variantId: it.variantId,
            quantity: qty,
            unitCost: cost,
            totalCost: qty * cost,
          },
        });

        // Increment Inventory
        const inv = await tx.inventory.findUnique({ where: { variantId: it.variantId } });
        if (inv) {
          const prev = inv.quantity;
          const next = prev + qty;
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: next, lastStockUpdate: new Date() },
          });

          await tx.stockMovement.create({
            data: {
              variantId: it.variantId,
              type: 'PURCHASE',
              quantity: qty,
              previousQty: prev,
              newQty: next,
              reason: `Purchase Inward #${invoiceNumber}`,
              referenceId: pur.id,
              userId: req.user.id,
            },
          });
        }
      }

      // Update Vendor stats
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          totalPurchases: { increment: grandTotal },
          outstandingAmount: { increment: outstanding },
        },
      });

      return pur;
    });

    res.status(201).json({ message: 'Purchase recorded and stock added', purchase });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: error.message || 'Failed to record purchase' });
  }
});

module.exports = router;
