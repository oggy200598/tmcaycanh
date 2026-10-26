const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');
const { authenticateToken, requireRoles } = require('../middlewares/auth');

router.get('/', plantController.getPlants);
router.get('/:id', plantController.getPlantById);
router.post('/', authenticateToken, requireRoles('Supplier', 'Admin'), plantController.createPlant);
router.patch('/:id/status', authenticateToken, requireRoles('Staff', 'Admin'), plantController.updatePlantStatus);

module.exports = router;
