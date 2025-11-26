const express = require('express');
const cors = require('cors');
const passport = require('./config/passport'); // ✅ Add this
require('dotenv').config();

const { connectDB } = require('./config/db');
require('./models');

const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const donationRoutes = require('./routes/donationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const emailRoutes = require('./routes/emailRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const adminRoutes = require('./routes/adminRoutes');

const { initializeScheduler } = require('./scheduler/alertScheduler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Initialize Passport
app.use(passport.initialize());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🩸 OptiBlood API is running',
    version: '1.0.0',
    features: {
      oauth: 'enabled',
      twoFactor: 'enabled'
    },
    endpoints: {
      auth: '/api/auth',
      google_oauth: '/api/auth/google',
      donors: '/api/donors',
      donations: '/api/donations',
      inventory: '/api/inventory',
      predictions: '/api/predictions',
      alerts: '/api/alerts'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/predict-shortage', predictionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🩸 OptiBlood Backend Server');
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Disabled'}`);
      console.log(`🔒 2FA: Enabled`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      
      initializeScheduler();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;