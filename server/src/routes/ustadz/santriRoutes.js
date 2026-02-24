const express = require('express');
const router = express.Router();
const santriController = require('../../controllers/ustadz/santriController');

router.get('/', santriController.getDaftarSantri);
router.get('/:idSantri/pengaduan', santriController.getPengaduanByUstadz);

module.exports = router;