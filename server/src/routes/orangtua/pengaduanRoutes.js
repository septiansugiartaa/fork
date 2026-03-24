const express = require('express');
const router = express.Router();
const pengaduanController = require('../../controllers/orangtua/pengaduanController');

router.get('/santri-options', pengaduanController.getSantriOptions);
router.get('/', pengaduanController.getDaftarPengaduan);
router.get('/:id', pengaduanController.getDetailPengaduan);
router.post('', pengaduanController.buatPengaduan);
router.post('/tanggapan', pengaduanController.kirimTanggapan);

module.exports = router;