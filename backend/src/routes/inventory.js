const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/inventory - Inventory overview
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, brandId, categoryId, lowStockOnly, rackId } = req.query;

    const where = {};
    if (brandId) where.product = { ...where.product, brandId };
    if (categoryId) where.product = { ...where.product, categoryId };

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { colour: { contains: q, mode: 'insensitive' } },
        { size: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { product: { articleNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: { include: { brand: true, category: true } },
        inventory: true,
        rackLocation: {
          include: {
            shelf: {
              include: {
                rack: {
                  include: { department: { include: { floor: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let results = variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      productName: v.product.name,
      articleNumber: v.product.articleNumber,
      brand: v.product.brand.name,
      category: v.product.category.name,
      gender: v.product.gender,
      imageUrl: v.product.imageUrl,
      size: v.size,
      colour: v.colour,
      sku: v.sku,
      barcode: v.barcode,
      purchasePrice: v.purchasePrice,
      sellingPrice: v.sellingPrice,
      mrp: v.mrp,
      quantity: v.inventory ? v.inventory.quantity : 0,
      minStockAlert: v.inventory ? v.inventory.minStockAlert : 3,
      isLowStock: (v.inventory ? v.inventory.quantity : 0) <= (v.inventory ? v.inventory.minStockAlert : 3),
      displayStockQty: v.displayStockQty,
      clearanceTier: v.clearanceTier,
      clearanceStatus: v.clearanceStatus,
      clearanceDiscount: v.clearanceDiscount,
      rackLocation: v.rackLocation
        ? `${v.rackLocation.shelf.rack.department.floor.name} → ${v.rackLocation.shelf.rack.department.name} → ${v.rackLocation.shelf.rack.code} → Shelf ${v.rackLocation.shelf.shelfNumber} → Pos ${v.rackLocation.position}`
        : 'Unassigned',
      rackCode: v.rackLocation ? v.rackLocation.shelf.rack.code : 'None',
      locationId: v.rackLocationId,
    }));

    if (lowStockOnly === 'true') {
      results = results.filter((r) => r.isLowStock);
    }

    if (rackId) {
      results = results.filter((r) => r.rackCode === rackId);
    }

    res.json({ inventory: results, total: results.length });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory/adjust - Stock adjustment (Management Only)
router.post('/adjust', authenticate, requireManagement, async (req, res) => {
  try {
    const { variantId, newQuantity, reason, adjustmentType } = req.body;

    if (!variantId || newQuantity === undefined) {
      return res.status(400).json({ error: 'Variant ID and new quantity are required' });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true, product: true },
    });

    if (!variant || !variant.inventory) {
      return res.status(404).json({ error: 'Variant or inventory not found' });
    }

    const previousQty = variant.inventory.quantity;
    const targetQty = parseInt(newQuantity, 10);

    if (targetQty < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative' });
    }

    const delta = targetQty - previousQty;

    await prisma.$transaction([
      prisma.inventory.update({
        where: { id: variant.inventory.id },
        data: {
          quantity: targetQty,
          lastStockUpdate: new Date(),
        },
      }),
      prisma.stockMovement.create({
        data: {
          variantId,
          type: adjustmentType || 'ADJUSTMENT',
          quantity: Math.abs(delta),
          previousQty,
          newQty: targetQty,
          reason: reason || 'Manual stock correction/audit',
          userId: req.user.id,
        },
      }),
    ]);

    res.json({
      message: 'Stock adjusted successfully',
      variantId,
      previousQty,
      newQty: targetQty,
    });
  } catch (error) {
    console.error('Inventory adjust error:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// GET /api/inventory/movements - Global stock movement history
router.get('/movements', authenticate, async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        variant: {
          include: {
            product: { include: { brand: true } },
          },
        },
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ movements });
  } catch (error) {
    console.error('Movements error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// GET /api/inventory/history/:variantId - History for specific variant
router.get('/history/:variantId', authenticate, async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { variantId: req.params.variantId },
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ movements });
  } catch (error) {
    console.error('Variant history error:', error);
    res.status(500).json({ error: 'Failed to fetch variant stock history' });
  }
});

module.exports = router;
