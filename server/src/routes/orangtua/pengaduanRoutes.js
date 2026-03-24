const express = require('express');
const router = express.Router();
const pengaduanController = require('../../controllers/orangtua/pengaduanController');

// Semua route butuh login
router.get('/', pengaduanController.getDaftarPengaduan);
router.get('/:id', pengaduanController.getDetailPengaduan);
router.post('/tanggapan', pengaduanController.kirimTanggapan);

module.exports = router;