const express = require('express');
const router = express.Router();
const pengaduanController = require('../../controllers/admin/pengaduanController');

router.get('/', pengaduanController.getDaftarPengaduan);
router.get('/:id', pengaduanController.getDetailPengaduan);
router.put('/:id/selesai', pengaduanController.selesaikanPengaduan);
router.delete('/:id', pengaduanController.hapusPengaduan);
router.delete('/tanggapan/:idTanggapan', pengaduanController.hapusTanggapan);

module.exports = router;