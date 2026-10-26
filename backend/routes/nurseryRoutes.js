const express = require('express');
const router = express.Router();
const nurseryController = require('../controllers/nurseryController');
const { authenticateToken, requireRoles } = require('../middlewares/auth');

router.get('/', nurseryController.getNurseries);
router.get('/:id', nurseryController.getNurseryById);
router.post('/', authenticateToken, requireRoles('Supplier', 'Admin'), nurseryController.createNursery);

module.exports = router;
