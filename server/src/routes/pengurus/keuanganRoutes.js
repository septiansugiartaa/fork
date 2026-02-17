const express = require('express');
const router = express.Router();
const keuanganController = require('../../controllers/pengurus/keuanganController');

router.get('/tagihan', keuanganController.getTagihan);
router.get('/options', keuanganController.getOptions);
router.post('/tagihan', keuanganController.createTagihan);
router.put('/tagihan/:id', keuanganController.updateTagihan);
router.delete('/tagihan/:id', keuanganController.deleteTagihan);

router.get('/pembayaran/:idTagihan', keuanganController.getPembayaranByTagihan);
router.put('/tagihan/:id/status', keuanganController.updateStatusTagihan);
router.put('/pembayaran/:id/verify', keuanganController.verifyPembayaran);

module.exports = router;