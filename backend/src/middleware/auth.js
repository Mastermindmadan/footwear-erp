const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'footwear-erp-ultra-secure-key-2026';

// In-memory user cache to eliminate redundant cross-ocean DB lookups on every request
const userMemoryCache = new Map();
const USER_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Authenticate any logged-in user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fast memory cache check
    const cached = userMemoryCache.get(decoded.userId);
    if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL) {
      req.user = cached.user;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      userMemoryCache.delete(decoded.userId);
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    userMemoryCache.set(decoded.userId, { user, cachedAt: Date.now() });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

// Enforce Management Role
const requireManagement = (req, res, next) => {
  if (!req.user || req.user.role !== 'MANAGEMENT') {
    return res.status(403).json({ error: 'Forbidden: Management privilege required' });
  }
  next();
};

// Enforce Sales Executive or Management Role
const requireSalesOrManagement = (req, res, next) => {
  if (!req.user || (req.user.role !== 'SALES_EXECUTIVE' && req.user.role !== 'MANAGEMENT')) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  next();
};

module.exports = {
  authenticate,
  requireManagement,
  requireSalesOrManagement,
  JWT_SECRET,
};
