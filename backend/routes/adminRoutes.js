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
// ADMIN & STAFF CRUD (USERS ONLY FOR ADMIN)
// ==========================================

// 1. CÂY CẢNH (PLANTS)
router.get('/plants', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminPlants);
router.post('/plants', authenticateToken, requireRoles('Admin', 'Staff'), adminController.createAdminPlant);
router.put('/plants/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.updateAdminPlant);
router.delete('/plants/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.deleteAdminPlant);

// 2. NHÀ CUNG CẤP (SUPPLIERS)
router.get('/suppliers', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminSuppliers);
router.post('/suppliers', authenticateToken, requireRoles('Admin', 'Staff'), adminController.createAdminSupplier);
router.put('/suppliers/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.updateAdminSupplier);
router.delete('/suppliers/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.deleteAdminSupplier);

// 3. VƯỜN ƯƠM (NURSERIES)
router.get('/nurseries', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminNurseries);
router.post('/nurseries', authenticateToken, requireRoles('Admin', 'Staff'), adminController.createAdminNursery);
router.put('/nurseries/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.updateAdminNursery);
router.delete('/nurseries/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.deleteAdminNursery);

// 4. DANH MỤC (CATEGORIES)
router.post('/categories', authenticateToken, requireRoles('Admin', 'Staff'), adminController.createAdminCategory);
router.put('/categories/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.updateAdminCategory);
router.delete('/categories/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.deleteAdminCategory);

// 5. ĐƠN HÀNG (ORDERS) - CHỈ XEM, KHÔNG CHO SỬA HAY XÓA
router.get('/orders', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminOrders);
router.get('/orders/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminOrderDetail);

// 6. TỒN KHO (INVENTORY) - THÊM SỬA XÓA (ADMIN & STAFF)
router.get('/inventory', authenticateToken, requireRoles('Admin', 'Staff'), adminController.getAdminInventory);
router.post('/inventory', authenticateToken, requireRoles('Admin', 'Staff'), adminController.createAdminInventory);
router.put('/inventory/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.updateAdminInventory);
router.delete('/inventory/:id', authenticateToken, requireRoles('Admin', 'Staff'), adminController.deleteAdminInventory);

module.exports = router;
