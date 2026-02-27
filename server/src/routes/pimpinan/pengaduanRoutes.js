const express = require('express');
const router = express.Router();
const pengaduanController = require('../../controllers/pimpinan/pengaduanController');

router.get('/', pengaduanController.getDaftarPengaduan);
router.get('/:id', pengaduanController.getDetailPengaduan);

module.exports = router;