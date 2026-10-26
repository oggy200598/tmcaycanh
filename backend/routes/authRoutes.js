const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getProfile);
router.get('/addresses', authenticateToken, authController.getAddresses);
router.post('/addresses', authenticateToken, authController.addAddress);

module.exports = router;
