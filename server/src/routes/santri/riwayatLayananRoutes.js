const express = require('express');
const router = express.Router();
const riwayatLayananController = require('../../controllers/santri/riwayatLayananController');

router.get('/', riwayatLayananController.getRiwayatLayanan);
router.get('/:id', riwayatLayananController.getDetailRiwayat);
router.post('/feedback', riwayatLayananController.kirimFeedbackLayanan);

module.exports = router;