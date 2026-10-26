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

// ==========================================
// ADMIN STRICT CRUD (ROLE = ADMIN ONLY)
// ==========================================

// 1. CÂY CẢNH (PLANTS)
router.get('/plants', authenticateToken, requireRoles('Admin'), adminController.getAdminPlants);
router.post('/plants', authenticateToken, requireRoles('Admin'), adminController.createAdminPlant);
router.put('/plants/:id', authenticateToken, requireRoles('Admin'), adminController.updateAdminPlant);
router.delete('/plants/:id', authenticateToken, requireRoles('Admin'), adminController.deleteAdminPlant);

// 2. NHÀ CUNG CẤP (SUPPLIERS)
router.get('/suppliers', authenticateToken, requireRoles('Admin'), adminController.getAdminSuppliers);
router.post('/suppliers', authenticateToken, requireRoles('Admin'), adminController.createAdminSupplier);
router.put('/suppliers/:id', authenticateToken, requireRoles('Admin'), adminController.updateAdminSupplier);
router.delete('/suppliers/:id', authenticateToken, requireRoles('Admin'), adminController.deleteAdminSupplier);

// 3. VƯỜN ƯƠM (NURSERIES)
router.get('/nurseries', authenticateToken, requireRoles('Admin'), adminController.getAdminNurseries);
router.post('/nurseries', authenticateToken, requireRoles('Admin'), adminController.createAdminNursery);
router.put('/nurseries/:id', authenticateToken, requireRoles('Admin'), adminController.updateAdminNursery);
router.delete('/nurseries/:id', authenticateToken, requireRoles('Admin'), adminController.deleteAdminNursery);

// 4. DANH MỤC (CATEGORIES)
router.post('/categories', authenticateToken, requireRoles('Admin'), adminController.createAdminCategory);
router.put('/categories/:id', authenticateToken, requireRoles('Admin'), adminController.updateAdminCategory);
router.delete('/categories/:id', authenticateToken, requireRoles('Admin'), adminController.deleteAdminCategory);

// 5. ĐƠN HÀNG (ORDERS) - CHỈ XEM, KHÔNG CHO SỬA HAY XÓA
router.get('/orders', authenticateToken, requireRoles('Admin'), adminController.getAdminOrders);
router.get('/orders/:id', authenticateToken, requireRoles('Admin'), adminController.getAdminOrderDetail);

// 6. TỒN KHO (INVENTORY) - THÊM SỬA XÓA (ADMIN ONLY)
router.get('/inventory', authenticateToken, requireRoles('Admin'), adminController.getAdminInventory);
router.post('/inventory', authenticateToken, requireRoles('Admin'), adminController.createAdminInventory);
router.put('/inventory/:id', authenticateToken, requireRoles('Admin'), adminController.updateAdminInventory);
router.delete('/inventory/:id', authenticateToken, requireRoles('Admin'), adminController.deleteAdminInventory);

module.exports = router;
