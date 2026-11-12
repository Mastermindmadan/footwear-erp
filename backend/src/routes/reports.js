const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/reports/generate - Dynamic report generator
router.get('/generate', authenticate, requireManagement, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    // type: SALES, PURCHASES, INVENTORY, STOCK_MOVEMENTS, AGEING, CLEARANCE, DAMAGED, SALESPERSON, FINANCIALS

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }

    let reportData = [];
    let summary = {};

    switch (type) {
      case 'SALES': {
        const where = {};
        if (startDate || endDate) where.saleDate = dateFilter;
        where.paymentStatus = 'COMPLETED';

        const sales = await prisma.sale.findMany({
          where,
          include: {
            customer: true,
            salesExecutive: { select: { name: true } },
            items: {
              include: {
                variant: {
                  include: { product: { include: { brand: true } } },
                },
              },
            },
          },
          orderBy: { saleDate: 'desc' },
        });

        reportData = sales.map((s) => ({
          'Invoice Number': s.invoiceNumber,
          Date: new Date(s.saleDate).toLocaleDateString(),
          Customer: s.customer ? `${s.customer.name} (${s.customer.phone})` : 'Walk-in',
          Salesperson: s.salesExecutive.name,
          Items: s.items.map((i) => `${i.variant.product.name} [${i.variant.size}] x${i.quantity}`).join('; '),
          Subtotal: `₹${s.subtotal}`,
          GST: `₹${s.taxAmount}`,
          Discount: `₹${s.discountAmount}`,
          Total: `₹${s.grandTotal}`,
          'Payment Mode': s.paymentMethod,
        }));

        const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
        summary = { count: sales.length, totalRevenue };
        break;
      }

      case 'PURCHASES': {
        const where = {};
        if (startDate || endDate) where.purchaseDate = dateFilter;

        const purchases = await prisma.purchase.findMany({
          where,
          include: { vendor: true },
          orderBy: { purchaseDate: 'desc' },
        });

        reportData = purchases.map((p) => ({
          'Invoice No': p.invoiceNumber,
          Date: new Date(p.purchaseDate).toLocaleDateString(),
          Vendor: p.vendor.name,
          Amount: `₹${p.grandTotal}`,
          'Paid Amount': `₹${p.paidAmount}`,
          Outstanding: `₹${p.outstandingAmount}`,
          Status: p.paymentStatus,
        }));

        summary = {
          count: purchases.length,
          totalAmount: purchases.reduce((acc, p) => acc + p.grandTotal, 0),
          totalOutstanding: purchases.reduce((acc, p) => acc + p.outstandingAmount, 0),
        };
        break;
      }

      case 'INVENTORY': {
        const variants = await prisma.productVariant.findMany({
          include: {
            product: { include: { brand: true, category: true } },
            inventory: true,
            rackLocation: true,
          },
        });

        reportData = variants.map((v) => ({
          'Product Name': v.product.name,
          Article: v.product.articleNumber,
          Brand: v.product.brand.name,
          Category: v.product.category.name,
          Size: v.size,
          Colour: v.colour,
          Barcode: v.barcode,
          Quantity: v.inventory ? v.inventory.quantity : 0,
          'Purchase Price': `₹${v.purchasePrice}`,
          'Selling Price': `₹${v.sellingPrice}`,
          MRP: `₹${v.mrp}`,
          'Stock Value': `₹${(v.inventory ? v.inventory.quantity : 0) * v.purchasePrice}`,
          Tier: v.clearanceTier,
        }));

        summary = {
          variantsCount: variants.length,
          totalStockPairs: variants.reduce((acc, v) => acc + (v.inventory ? v.inventory.quantity : 0), 0),
        };
        break;
      }

      case 'DAMAGED': {
        const damaged = await prisma.damagedProduct.findMany({
          include: {
            variant: { include: { product: true } },
            responsibleUser: { select: { name: true } },
          },
          orderBy: { damageDate: 'desc' },
        });

        reportData = damaged.map((d) => ({
          Product: `${d.variant.product.name} (${d.variant.colour}/${d.variant.size})`,
          'Damage Type': d.damageType,
          Quantity: d.quantity,
          Date: new Date(d.damageDate).toLocaleDateString(),
          Status: d.status,
          'Responsible Person': d.responsibleUser ? d.responsibleUser.name : 'Store',
          'Repair Cost': `₹${d.actualRepairCost || d.estimatedRepairCost}`,
        }));
        summary = { count: damaged.length };
        break;
      }

      case 'SALESPERSON': {
        const executives = await prisma.user.findMany({
          where: { role: 'SALES_EXECUTIVE' },
          include: {
            sales: {
              where: { paymentStatus: 'COMPLETED' },
              include: { items: true },
            },
          },
        });

        reportData = executives.map((e) => {
          const totalSales = e.sales.reduce((a, b) => a + b.grandTotal, 0);
          const pairs = e.sales.reduce((a, s) => a + s.items.reduce((acc, it) => acc + it.quantity, 0), 0);
          return {
            'Executive Name': e.name,
            Email: e.email,
            'Bills Generated': e.sales.length,
            'Total Pairs Sold': pairs,
            'Total Revenue': `₹${totalSales.toLocaleString()}`,
            'Average Order Value': e.sales.length > 0 ? `₹${Math.round(totalSales / e.sales.length)}` : '₹0',
          };
        });
        summary = { count: executives.length };
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json({ type, reportData, summary });
  } catch (error) {
    console.error('Reports generate error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
