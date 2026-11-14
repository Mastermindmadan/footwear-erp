const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/sales/checkout - POS Billing & Stock Deduction Transaction
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const {
      customerId,
      customerDetails, // { name, phone, email, address } if new customer
      items, // array of { variantId, quantity, discountPercent }
      paymentMethod, // CASH, UPI, CARD, SPLIT
      cashAmount = 0,
      upiAmount = 0,
      cardAmount = 0,
      discountAmount = 0,
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add products to checkout.' });
    }

    const salesExecutiveId = req.user.id;

    // Use Prisma transaction to ensure atomicity
    const checkoutResult = await prisma.$transaction(async (tx) => {
      // 1. Resolve or create customer
      let finalCustomerId = customerId;
      if (!finalCustomerId && customerDetails && customerDetails.phone) {
        let existingCustomer = await tx.customer.findUnique({
          where: { phone: customerDetails.phone.trim() },
        });

        if (!existingCustomer) {
          existingCustomer = await tx.customer.create({
            data: {
              name: customerDetails.name || 'Walk-in Customer',
              phone: customerDetails.phone.trim(),
              email: customerDetails.email || null,
              address: customerDetails.address || null,
            },
          });
        }
        finalCustomerId = existingCustomer.id;
      }

      // 2. Validate inventory for all items
      let subtotal = 0;
      let totalTaxAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: {
            inventory: true,
            product: true,
          },
        });

        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found`);
        }

        if (variant.product && variant.product.status !== 'ACTIVE') {
          throw new Error(`Product "${variant.product.name}" has been deactivated and cannot be sold.`);
        }

        const availableQty = variant.inventory ? variant.inventory.quantity : 0;
        const requestedQty = parseInt(item.quantity, 10);

        if (requestedQty <= 0) {
          throw new Error(`Invalid quantity ${requestedQty} for ${variant.product.name}`);
        }

        if (requestedQty > availableQty) {
          throw new Error(
            `Insufficient stock for "${variant.product.name} (${variant.colour} / ${variant.size})". Available: ${availableQty}, Requested: ${requestedQty}`
          );
        }

        // Price calculation
        // If clearance discount applies:
        let unitPrice = variant.sellingPrice;
        if (variant.clearanceApproved && variant.clearanceDiscount > 0) {
          unitPrice = Math.round(unitPrice * (1 - variant.clearanceDiscount / 100));
        }

        const itemDiscountPct = parseFloat(item.discountPercent || 0);
        const effectiveUnitPrice = unitPrice * (1 - itemDiscountPct / 100);
        const lineTotal = effectiveUnitPrice * requestedQty;

        // Footwear GST Rule: 5% for <= ₹1000, 12% for > ₹1000
        const gstRate = effectiveUnitPrice > 1000 ? 12 : 5;
        const lineTax = Math.round((lineTotal * gstRate) / 100);

        subtotal += lineTotal;
        totalTaxAmount += lineTax;

        validatedItems.push({
          variant,
          requestedQty,
          unitPrice,
          effectiveUnitPrice,
          itemDiscountPct,
          gstRate,
          lineTax,
          lineTotalWithTax: lineTotal + lineTax,
        });
      }

      const overallDiscount = parseFloat(discountAmount || 0);
      const grandTotal = Math.max(0, Math.round(subtotal + totalTaxAmount - overallDiscount));

      // 3. Generate Sequential Invoice Number
      const count = await tx.sale.count();
      const currentYear = new Date().getFullYear();
      const seqNumber = String(count + 1).padStart(4, '0');
      const invoiceNumber = `INV-${currentYear}-${seqNumber}`;

      // 4. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: finalCustomerId || null,
          salesExecutiveId,
          saleDate: new Date(),
          subtotal: Math.round(subtotal),
          discountAmount: overallDiscount,
          taxAmount: totalTaxAmount,
          grandTotal,
          paymentMethod: paymentMethod || 'CASH',
          cashAmount: paymentMethod === 'CASH' ? grandTotal : parseFloat(cashAmount || 0),
          upiAmount: paymentMethod === 'UPI' ? grandTotal : parseFloat(upiAmount || 0),
          cardAmount: paymentMethod === 'CARD' ? grandTotal : parseFloat(cardAmount || 0),
          paymentStatus: 'COMPLETED',
          notes,
        },
      });

      // 5. Create Sale Items and Deduct Inventory concurrently
      await Promise.all(
        validatedItems.map(async (vi) => {
          await tx.saleItem.create({
            data: {
              saleId: sale.id,
              variantId: vi.variant.id,
              quantity: vi.requestedQty,
              unitPrice: vi.unitPrice,
              discountPercent: vi.itemDiscountPct,
              taxPercent: vi.gstRate,
              finalPrice: vi.lineTotalWithTax,
            },
          });

          // Deduct inventory
          const currentQty = vi.variant.inventory.quantity;
          const newQty = currentQty - vi.requestedQty;

          await tx.inventory.update({
            where: { id: vi.variant.inventory.id },
            data: {
              quantity: newQty,
              lastStockUpdate: new Date(),
            },
          });

          // Record Stock Movement
          await tx.stockMovement.create({
            data: {
              variantId: vi.variant.id,
              type: 'SALE',
              quantity: vi.requestedQty,
              previousQty: currentQty,
              newQty,
              reason: `POS Sale Invoice #${invoiceNumber}`,
              referenceId: sale.id,
              userId: salesExecutiveId,
            },
          });

          // If stock reaches 0 or below min stock alert, check if notification exists
          if (newQty <= vi.variant.inventory.minStockAlert) {
            await tx.notification.create({
              data: {
                type: 'LOW_STOCK',
                title: `Low Stock Alert: ${vi.variant.product.name}`,
                message: `Variant ${vi.variant.colour} / ${vi.variant.size} has fallen to ${newQty} pairs remaining.`,
                severity: newQty === 0 ? 'CRITICAL' : 'WARNING',
                link: '/management/inventory',
              },
            });
          }
        })
      );

      // 6. Update Customer Total Purchases
      if (finalCustomerId) {
        await tx.customer.update({
          where: { id: finalCustomerId },
          data: { totalPurchases: { increment: grandTotal } },
        });
      }

      // 7. Update Sales Target for Sales Executive
      const now = new Date();
      await tx.salesTarget.updateMany({
        where: {
          userId: salesExecutiveId,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        data: {
          achievedAmount: { increment: grandTotal },
          achievedPairs: { increment: items.reduce((acc, it) => acc + parseInt(it.quantity, 10), 0) },
        },
      });

      return sale;
    }, {
      maxWait: 10000,
      timeout: 25000,
    });

    // Return complete sale with details
    const fullSale = await prisma.sale.findUnique({
      where: { id: checkoutResult.id },
      include: {
        customer: true,
        salesExecutive: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true, category: true } },
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
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Billing completed successfully and inventory updated!',
      sale: fullSale,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({ error: error.message || 'Billing checkout failed' });
  }
});

// GET /api/sales - List all sales for Management
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      salespersonId,
      customerId,
      paymentMethod,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = {};

    if (salespersonId) where.salesExecutiveId = salespersonId;
    if (customerId) where.customerId = customerId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.saleDate.lte = eDate;
      }
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { customer: { name: { contains: q, mode: 'insensitive' } } },
        { customer: { phone: { contains: q, mode: 'insensitive' } } },
        { salesExecutive: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        salesExecutive: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true } },
              },
            },
          },
        },
      },
      orderBy: { saleDate: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const totalCount = await prisma.sale.count({ where });

    res.json({ sales, totalCount });
  } catch (error) {
    console.error('Sales fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sales records' });
  }
});

// GET /api/sales/history/my - Sales history for logged in Sales Executive
router.get('/history/my', authenticate, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { salesExecutiveId: req.user.id },
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true } },
              },
            },
          },
        },
      },
      orderBy: { saleDate: 'desc' },
      take: 100,
    });

    res.json({ sales });
  } catch (error) {
    console.error('My sales history error:', error);
    res.status(500).json({ error: 'Failed to fetch personal sales history' });
  }
});

// GET /api/sales/:id - Invoice details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        salesExecutive: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true, category: true } },
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
            },
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// POST /api/sales/:id/return - Process Return / Refund and Restock Inventory
router.post('/:id/return', authenticate, async (req, res) => {
  try {
    const { reason = 'Customer Return / Exchange' } = req.body;
    const saleId = req.params.id;

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found' });
    }

    if (sale.paymentStatus === 'RETURNED' || sale.paymentStatus === 'REFUNDED') {
      return res.status(400).json({ error: 'This sale has already been processed for return / refund' });
    }

    // Process return inside a transaction
    const returnResult = await prisma.$transaction(async (tx) => {
      // 1. Update sale payment status to RETURNED
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          paymentStatus: 'RETURNED',
          notes: sale.notes ? `${sale.notes} | Returned: ${reason}` : `Returned: ${reason}`,
        },
      });

      // 2. Restock each item back to inventory and log stock movement concurrently
      await Promise.all(
        sale.items.map(async (item) => {
          const inv = await tx.inventory.findUnique({
            where: { variantId: item.variantId },
          });

          if (inv) {
            const prevQty = inv.quantity;
            const newQty = prevQty + item.quantity;

            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                quantity: newQty,
                lastStockUpdate: new Date(),
              },
            });

            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: 'ADJUSTMENT',
                quantity: item.quantity,
                previousQty: prevQty,
                newQty,
                reason: `Sale Return Invoice #${sale.invoiceNumber}: ${reason}`,
                referenceId: sale.id,
                userId: req.user.id,
              },
            });
          }
        })
      );

      // 3. Decrement customer total purchases if customer linked
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalPurchases: { decrement: sale.grandTotal },
          },
        });
      }

      return updatedSale;
    }, {
      maxWait: 10000,
      timeout: 25000,
    });

    res.json({
      message: `Invoice #${sale.invoiceNumber} successfully returned and inventory restocked`,
      sale: returnResult,
    });
  } catch (error) {
    console.error('Sale return error:', error);
    res.status(500).json({ error: error.message || 'Failed to process return' });
  }
});

module.exports = router;
