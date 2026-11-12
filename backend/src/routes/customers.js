const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/customers - Search customer by query (phone/name)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { phone: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { totalPurchases: 'desc' },
      take: 20,
    });

    res.json({ customers });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST /api/customers - Add a new customer
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }

    const cleanPhone = phone.trim();
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (customer) {
      return res.status(400).json({ error: 'Customer with this phone already exists', customer });
    }

    customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      },
    });

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

module.exports = router;
