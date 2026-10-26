const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireRoles } = require('../middlewares/auth');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.patch('/:id/status', authenticateToken, requireRoles('Supplier', 'Staff', 'Admin'), orderController.updateOrderStatus);
router.patch('/:id/health-check', authenticateToken, requireRoles('Supplier', 'Staff', 'Admin'), orderController.confirmPlantHealth);

module.exports = router;
