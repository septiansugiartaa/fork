const express = require("express");
const router = express.Router();
const keuanganController = require("../../controllers/orangtua/keuanganController");
const createUploader = require('../../middleware/uploadMiddleware');

router.get("/", keuanganController.getKeuanganDashboard);

const bayar = createUploader('payments', 'payment');
router.post('/bayar', bayar.single('bukti_bayar'), keuanganController.uploadPembayaran);

module.exports = router;
