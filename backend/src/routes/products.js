const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

let filtersCache = null;
let filtersCacheTime = 0;
const FILTERS_CACHE_TTL = 60000; // 60 seconds

// GET /api/products/meta/filters - Brands, Categories, Sizes, Colours
router.get('/meta/filters', authenticate, async (req, res) => {
  try {
    if (filtersCache && Date.now() - filtersCacheTime < FILTERS_CACHE_TTL) {
      return res.json(filtersCache);
    }

    const [brands, categories, variants] = await Promise.all([
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.productVariant.findMany({
        select: { size: true, colour: true },
        distinct: ['size', 'colour'],
      }),
    ]);

    const sizes = [...new Set(variants.map((v) => v.size))].sort();
    const colours = [...new Set(variants.map((v) => v.colour))].sort();

    filtersCache = { brands, categories, sizes, colours };
    filtersCacheTime = Date.now();

    res.json(filtersCache);
  } catch (error) {
    console.error('Filter meta error:', error);
    res.status(500).json({ error: 'Failed to fetch filter metadata' });
  }
});

// GET /api/products/barcode/:barcode - Scan barcode lookup
router.get('/barcode/:barcode', authenticate, async (req, res) => {
  try {
    const { barcode } = req.params;
    const variant = await prisma.productVariant.findUnique({
      where: { barcode: barcode.trim() },
      include: {
        product: {
          include: { brand: true, category: true },
        },
        inventory: true,
        rackLocation: {
          include: {
            shelf: {
              include: {
                rack: {
                  include: {
                    department: {
                      include: { floor: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!variant) {
      return res.status(404).json({ error: `No footwear found with barcode: ${barcode}` });
    }

    if (variant.product && variant.product.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Footwear "${variant.product.name}" has been deactivated and cannot be sold.` });
    }

    res.json({ variant });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Failed to look up barcode' });
  }
});

// GET /api/products - List / Search / Filter
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      brandId,
      categoryId,
      gender,
      size,
      colour,
      clearanceTier,
      rackType,
      limit = 100,
      offset = 0,
    } = req.query;

    const where = { status: 'ACTIVE' };

    if (brandId) where.brandId = brandId;
    if (categoryId) where.categoryId = categoryId;
    if (gender) where.gender = gender;

    // Search query matches product name, articleNumber, or variant barcode/sku
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { articleNumber: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
        {
          variants: {
            some: {
              OR: [
                { barcode: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { colour: { contains: q, mode: 'insensitive' } },
                { size: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const variantFilter = {};
    if (size) variantFilter.size = size;
    if (colour) variantFilter.colour = colour;
    if (clearanceTier) variantFilter.clearanceTier = clearanceTier;

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: {
          where: Object.keys(variantFilter).length > 0 ? variantFilter : undefined,
          include: {
            inventory: true,
            rackLocation: {
              include: {
                shelf: {
                  include: {
                    rack: {
                      include: {
                        department: {
                          include: { floor: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = await prisma.product.count({ where });

    res.json({ products, totalCount });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Product details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        category: true,
        variants: {
          include: {
            inventory: true,
            rackLocation: {
              include: {
                shelf: {
                  include: {
                    rack: {
                      include: {
                        department: {
                          include: { floor: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// POST /api/products - Create Product & Variants (Management Only)
router.post('/', authenticate, requireManagement, async (req, res) => {
  try {
    const {
      name,
      articleNumber,
      brandId,
      categoryId,
      gender,
      description,
      imageUrl,
      baseSellingPrice,
      mrp,
      purchasePrice,
      variants, // Array of { size, colour, barcode, sku, quantity, rackLocationId }
    } = req.body;

    if (!name || !articleNumber || !brandId || !categoryId || !baseSellingPrice) {
      return res.status(400).json({ error: 'Missing required product fields' });
    }

    // Check existing article number
    const existing = await prisma.product.findUnique({ where: { articleNumber } });
    if (existing) {
      return res.status(400).json({ error: `Article number ${articleNumber} already exists` });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          name,
          articleNumber,
          brandId,
          categoryId,
          gender: gender || 'UNISEX',
          description,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          baseSellingPrice: parseFloat(baseSellingPrice),
          mrp: parseFloat(mrp || baseSellingPrice),
          purchasePrice: parseFloat(purchasePrice || baseSellingPrice * 0.6),
        },
      });

      if (Array.isArray(variants) && variants.length > 0) {
        for (const v of variants) {
          const barcode = v.barcode || `890${Date.now().toString().slice(-10)}`;
          const sku = v.sku || `${articleNumber}-${v.size}-${v.colour.substring(0, 3)}`.toUpperCase().replace(/\s+/g, '');

          const variant = await tx.productVariant.create({
            data: {
              productId: prod.id,
              size: v.size,
              colour: v.colour,
              barcode,
              sku,
              purchasePrice: parseFloat(v.purchasePrice || prod.purchasePrice),
              sellingPrice: parseFloat(v.sellingPrice || prod.baseSellingPrice),
              mrp: parseFloat(v.mrp || prod.mrp),
              rackLocationId: v.rackLocationId || null,
              displayStockQty: 1,
              entryDate: new Date(),
              clearanceTier: 'FRESH',
            },
          });

          const qty = parseInt(v.quantity || 0);
          await tx.inventory.create({
            data: {
              variantId: variant.id,
              quantity: qty,
              minStockAlert: 3,
              maxStock: 50,
            },
          });

          if (qty > 0) {
            await tx.stockMovement.create({
              data: {
                variantId: variant.id,
                type: 'PURCHASE',
                quantity: qty,
                previousQty: 0,
                newQty: qty,
                reason: 'Initial Product Stock Inward',
                userId: req.user.id,
              },
            });
          }

          if (v.rackLocationId) {
            await tx.rackLocation.update({
              where: { id: v.rackLocationId },
              data: { isOccupied: true },
            });
          }
        }
      }

      return prod;
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: newProduct.id },
      include: {
        brand: true,
        category: true,
        variants: { include: { inventory: true, rackLocation: true } },
      },
    });

    res.status(201).json({ message: 'Product created successfully', product: fullProduct });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authenticate, requireManagement, async (req, res) => {
  try {
    const { name, brandId, categoryId, gender, description, imageUrl, baseSellingPrice, mrp, purchasePrice } = req.body;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        brandId,
        categoryId,
        gender,
        description,
        imageUrl,
        baseSellingPrice: parseFloat(baseSellingPrice),
        mrp: parseFloat(mrp),
        purchasePrice: parseFloat(purchasePrice),
      },
      include: {
        brand: true,
        category: true,
        variants: { include: { inventory: true, rackLocation: true } },
      },
    });

    res.json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authenticate, requireManagement, async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
