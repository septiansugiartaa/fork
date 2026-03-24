const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {verifyToken} = require('../../src/middleware/verifyToken');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/finalize-login', authController.finalizeLogin);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
