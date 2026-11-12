require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const productsRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const locationsRoutes = require('./routes/locations');
const salesRoutes = require('./routes/sales');
const purchasesRoutes = require('./routes/purchases');
const ageingRoutes = require('./routes/ageing');
const damagedRoutes = require('./routes/damaged');
const targetsRoutes = require('./routes/targets');
const vendorsRoutes = require('./routes/vendors');
const financialsRoutes = require('./routes/financials');
const analyticsRoutes = require('./routes/analytics');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const customersRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/ageing', ageingRoutes);
app.use('/api/damaged', damagedRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/financials', financialsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Footwear Retail Management ERP',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`👟 Footwear Retail ERP Server listening on port ${PORT}`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/api/health`);
});
