const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate, requireManagement } = require('../middleware/auth');

// GET /api/analytics/sales - Multi-dimensional sales analytics
router.get('/sales', authenticate, requireManagement, async (req, res) => {
  try {
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { paymentStatus: 'COMPLETED' } },
      include: {
        sale: {
          include: {
            salesExecutive: { select: { id: true, name: true } },
          },
        },
        variant: {
          include: {
            product: {
              include: { brand: true, category: true },
            },
          },
        },
      },
    });

    // Aggregators
    const brandMap = {};
    const categoryMap = {};
    const productMap = {};
    const sizeMap = {};
    const colourMap = {};
    const salespersonMap = {};

    saleItems.forEach((si) => {
      const qty = si.quantity;
      const revenue = si.finalPrice;
      const brand = si.variant.product.brand.name;
      const category = si.variant.product.category.name;
      const productName = si.variant.product.name;
      const articleNumber = si.variant.product.articleNumber;
      const size = si.variant.size;
      const colour = si.variant.colour;
      const salesperson = si.sale.salesExecutive.name;

      // Brand
      if (!brandMap[brand]) brandMap[brand] = { name: brand, pairs: 0, revenue: 0 };
      brandMap[brand].pairs += qty;
      brandMap[brand].revenue += revenue;

      // Category
      if (!categoryMap[category]) categoryMap[category] = { name: category, pairs: 0, revenue: 0 };
      categoryMap[category].pairs += qty;
      categoryMap[category].revenue += revenue;

      // Product / Article
      const pKey = `${productName} (${articleNumber})`;
      if (!productMap[pKey]) productMap[pKey] = { name: pKey, pairs: 0, revenue: 0, articleNumber };
      productMap[pKey].pairs += qty;
      productMap[pKey].revenue += revenue;

      // Size
      if (!sizeMap[size]) sizeMap[size] = { name: size, pairs: 0, revenue: 0 };
      sizeMap[size].pairs += qty;
      sizeMap[size].revenue += revenue;

      // Colour
      if (!colourMap[colour]) colourMap[colour] = { name: colour, pairs: 0, revenue: 0 };
      colourMap[colour].pairs += qty;
      colourMap[colour].revenue += revenue;

      // Salesperson
      if (!salespersonMap[salesperson]) salespersonMap[salesperson] = { name: salesperson, pairs: 0, revenue: 0 };
      salespersonMap[salesperson].pairs += qty;
      salespersonMap[salesperson].revenue += revenue;
    });

    const brandSales = Object.values(brandMap).sort((a, b) => b.revenue - a.revenue);
    const categorySales = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
    const productSales = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    const sizeSales = Object.values(sizeMap).sort((a, b) => b.pairs - a.pairs);
    const colourSales = Object.values(colourMap).sort((a, b) => b.pairs - a.pairs);
    const salespersonSales = Object.values(salespersonMap).sort((a, b) => b.revenue - a.revenue);

    const bestSellers = productSales.slice(0, 5);

    // Identify slow moving products (variants that have stock but zero or minimal sales)
    const allVariants = await prisma.productVariant.findMany({
      include: {
        product: { include: { brand: true } },
        inventory: true,
      },
      where: {
        inventory: { quantity: { gt: 0 } },
      },
    });

    const soldVariantIds = new Set(saleItems.map((si) => si.variantId));
    const slowMoving = allVariants
      .filter((v) => !soldVariantIds.has(v.id) || v.clearanceTier === 'AGEING' || v.clearanceTier === 'CLEARANCE_RECOMMENDED' || v.clearanceTier === 'DEAD_STOCK')
      .map((v) => ({
        id: v.id,
        name: `${v.product.name} - ${v.colour} (${v.size})`,
        brand: v.product.brand.name,
        stock: v.inventory.quantity,
        tier: v.clearanceTier,
        entryDate: v.entryDate,
      }))
      .slice(0, 8);

    res.json({
      brandSales,
      categorySales,
      productSales,
      sizeSales,
      colourSales,
      salespersonSales,
      bestSellers,
      slowMoving,
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch sales analytics' });
  }
});

// GET /api/analytics/purchases - Purchase trends & distribution
router.get('/purchases', authenticate, requireManagement, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        vendor: true,
        items: {
          include: {
            variant: {
              include: {
                product: { include: { brand: true, category: true } },
              },
            },
          },
        },
      },
    });

    const vendorMap = {};
    const brandMap = {};
    const sizeMap = {};
    const monthlyMap = {};

    purchases.forEach((pur) => {
      const vName = pur.vendor.name;
      if (!vendorMap[vName]) vendorMap[vName] = { name: vName, amount: 0, consignments: 0 };
      vendorMap[vName].amount += pur.grandTotal;
      vendorMap[vName].consignments += 1;

      // Month trend
      const mLabel = new Date(pur.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[mLabel]) monthlyMap[mLabel] = { month: mLabel, total: 0 };
      monthlyMap[mLabel].total += pur.grandTotal;

      pur.items.forEach((it) => {
        const brand = it.variant.product.brand.name;
        if (!brandMap[brand]) brandMap[brand] = { name: brand, cost: 0, pairs: 0 };
        brandMap[brand].cost += it.totalCost;
        brandMap[brand].pairs += it.quantity;

        const size = it.variant.size;
        if (!sizeMap[size]) sizeMap[size] = { name: size, pairs: 0 };
        sizeMap[size].pairs += it.quantity;
      });
    });

    res.json({
      vendorPurchases: Object.values(vendorMap).sort((a, b) => b.amount - a.amount),
      brandPurchases: Object.values(brandMap).sort((a, b) => b.cost - a.cost),
      sizePurchases: Object.values(sizeMap).sort((a, b) => b.pairs - a.pairs),
      monthlyPurchases: Object.values(monthlyMap),
    });
  } catch (error) {
    console.error('Purchase analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch purchase analytics' });
  }
});

module.exports = router;
