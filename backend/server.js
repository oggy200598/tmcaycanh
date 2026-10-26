const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const plantRoutes = require('./routes/plantRoutes');
const nurseryRoutes = require('./routes/nurseryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminController = require('./controllers/adminController');

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Healthcheck & DB test
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() AS current_time');
    res.json({
      status: 'UP',
      message: 'TMCayCanh Backend & Database Connected Successfully',
      database: process.env.DB_NAME || 'tmcaycanh',
      serverTime: dbRes.rows[0].current_time,
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Category shorthand route
app.get('/api/categories', adminController.getCategories);

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/nurseries', nurseryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Đã có lỗi xảy ra trên máy chủ.',
    },
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌿 TMCayCanh Backend Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;