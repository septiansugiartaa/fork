const express = require('express');
const router = express.Router();
const keuanganController = require('../../controllers/pimpinan/keuanganController');

router.get('/tagihan', keuanganController.getTagihan);
router.get('/pembayaran/:idTagihan', keuanganController.getPembayaranByTagihan);

module.exports = router;