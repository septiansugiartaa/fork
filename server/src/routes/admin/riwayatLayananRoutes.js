const express = require('express');
const router = express.Router();
const riwayatController = require('../../controllers/admin/riwayatLayananController');

router.get('/', riwayatController.getRiwayatLayanan);
router.put('/:id/status', riwayatController.updateStatusLayanan);

module.exports = router;