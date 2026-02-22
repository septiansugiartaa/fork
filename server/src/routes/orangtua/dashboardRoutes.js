const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/orangtua/dashboardController');

router.get('/', dashboardController.getDashboardData);

module.exports = router;