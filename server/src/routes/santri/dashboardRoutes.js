const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/santri/dashboardController');

router.get('/', dashboardController.getDashboardData);
router.get('/scabies/latest-reports', dashboardController.getLatestScabiesReports);
router.get('/scabies/materi/recent', dashboardController.getRecentMateriViews);
router.post('/scabies/materi/:id/view', dashboardController.trackMateriView);

module.exports = router;