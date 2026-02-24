const express = require('express');
const router = express.Router();
const pengaduanController = require('../../controllers/ustadz/pengaduanController');

router.get('/', pengaduanController.getDaftarPengaduan);
router.get('/santri-options', pengaduanController.getSantriOptions);
router.get('/:id', pengaduanController.getDetailPengaduan);
router.post('/', pengaduanController.buatPengaduan);
router.post('/tanggapan', pengaduanController.kirimTanggapan);
router.put('/:id/selesai', pengaduanController.selesaikanPengaduan);

module.exports = router;