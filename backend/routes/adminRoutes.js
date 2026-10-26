const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRoles } = require('../middlewares/auth');

// Public categories endpoint
router.get('/categories', adminController.getCategories);

// Admin & Staff protected routes
router.get('/dashboard', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getDashboardStats);
router.get('/heatmap', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getHeatmapData);
router.get('/users', authenticateToken, requireRoles('Admin'), adminController.getUsers);
router.patch('/users/:id/status', authenticateToken, requireRoles('Admin'), adminController.updateUserStatus);

module.exports = router;
