const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/pimpinan/dashboardController');

router.get('/', dashboardController.getDashboardData);

module.exports = router;