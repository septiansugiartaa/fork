const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {verifyToken} = require('../../src/middleware/verifyToken');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 5 menit.' },
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/finalize-login', authLimiter, authController.finalizeLogin);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
