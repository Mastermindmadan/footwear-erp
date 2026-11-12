const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/locations/hierarchy - Full store location hierarchy
router.get('/hierarchy', authenticate, async (req, res) => {
  try {
    const floors = await prisma.floor.findMany({
      include: {
        departments: {
          include: {
            racks: {
              include: {
                shelves: {
                  include: {
                    locations: {
                      include: {
                        variants: {
                          include: {
                            product: { include: { brand: true } },
                            inventory: true,
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
      },
      orderBy: { level: 'asc' },
    });

    res.json({ floors });
  } catch (error) {
    console.error('Locations hierarchy error:', error);
    res.status(500).json({ error: 'Failed to fetch location hierarchy' });
  }
});

// GET /api/locations/racks - Rack summary (Occupied, Empty, Items count, Display stock)
router.get('/racks', authenticate, async (req, res) => {
  try {
    const racks = await prisma.rack.findMany({
      include: {
        department: { include: { floor: true } },
        shelves: {
          include: {
            locations: {
              include: {
                variants: {
                  include: {
                    product: { include: { brand: true, category: true } },
                    inventory: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const rackSummaries = racks.map((rack) => {
      let totalLocations = 0;
      let occupiedLocations = 0;
      let totalPairsStored = 0;
      let totalDisplayPairs = 0;
      const storedItems = [];

      rack.shelves.forEach((shelf) => {
        shelf.locations.forEach((loc) => {
          totalLocations++;
          if (loc.isOccupied || loc.variants.length > 0) {
            occupiedLocations++;
          }
          loc.variants.forEach((v) => {
            const qty = v.inventory ? v.inventory.quantity : 0;
            totalPairsStored += qty;
            totalDisplayPairs += v.displayStockQty || 0;

            storedItems.push({
              variantId: v.id,
              productName: v.product.name,
              brand: v.product.brand.name,
              colour: v.colour,
              size: v.size,
              quantity: qty,
              displayQty: v.displayStockQty,
              shelfNumber: shelf.shelfNumber,
              position: loc.position,
              locationCode: loc.fullCode,
              clearanceTier: v.clearanceTier,
            });
          });
        });
      });

      return {
        id: rack.id,
        name: rack.name,
        code: rack.code,
        rackType: rack.rackType,
        floorName: rack.department.floor.name,
        departmentName: rack.department.name,
        totalLocations,
        occupiedLocations,
        emptyLocations: totalLocations - occupiedLocations,
        occupancyRate: totalLocations > 0 ? Math.round((occupiedLocations / totalLocations) * 100) : 0,
        totalPairsStored,
        totalDisplayPairs,
        items: storedItems,
      };
    });

    res.json({ racks: rackSummaries });
  } catch (error) {
    console.error('Racks fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch racks summary' });
  }
});

// POST /api/locations/assign - Assign product variant to location
router.post('/assign', authenticate, requireManagement, async (req, res) => {
  try {
    const { variantId, locationId, displayStockQty } = req.body;

    if (!variantId || !locationId) {
      return res.status(400).json({ error: 'variantId and locationId are required' });
    }

    // Free previous location if any
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (existingVariant && existingVariant.rackLocationId) {
      // Check if other variants share it
      const count = await prisma.productVariant.count({
        where: {
          rackLocationId: existingVariant.rackLocationId,
          id: { not: variantId },
        },
      });
      if (count === 0) {
        await prisma.rackLocation.update({
          where: { id: existingVariant.rackLocationId },
          data: { isOccupied: false },
        });
      }
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        rackLocationId: locationId,
        displayStockQty: displayStockQty !== undefined ? parseInt(displayStockQty, 10) : 1,
      },
    });

    await prisma.rackLocation.update({
      where: { id: locationId },
      data: { isOccupied: true },
    });

    res.json({ message: 'Product assigned to rack location successfully', variant: updated });
  } catch (error) {
    console.error('Assign location error:', error);
    res.status(500).json({ error: 'Failed to assign product to location' });
  }
});

// POST /api/locations/rack - Create a new rack
router.post('/rack', authenticate, requireManagement, async (req, res) => {
  try {
    const { name, code, departmentId, rackType, shelvesCount = 4, positionsPerShelf = 6 } = req.body;

    if (!name || !code || !departmentId) {
      return res.status(400).json({ error: 'name, code, and departmentId are required' });
    }

    const newRack = await prisma.$transaction(async (tx) => {
      const rack = await tx.rack.create({
        data: {
          name,
          code,
          departmentId,
          rackType: rackType || 'NORMAL',
        },
      });

      for (let s = 1; s <= parseInt(shelvesCount, 10); s++) {
        const shelf = await tx.shelf.create({
          data: {
            shelfNumber: s,
            code: `${code}-S${s}`,
            rackId: rack.id,
          },
        });

        for (let p = 1; p <= parseInt(positionsPerShelf, 10); p++) {
          const posStr = p < 10 ? `0${p}` : `${p}`;
          await tx.rackLocation.create({
            data: {
              shelfId: shelf.id,
              position: posStr,
              fullCode: `${code}-S${s}-P${posStr}`,
              isOccupied: false,
            },
          });
        }
      }

      return rack;
    });

    res.status(201).json({ message: 'Rack created successfully with shelves and locations', rack: newRack });
  } catch (error) {
    console.error('Create rack error:', error);
    res.status(500).json({ error: 'Failed to create rack' });
  }
});

module.exports = router;
