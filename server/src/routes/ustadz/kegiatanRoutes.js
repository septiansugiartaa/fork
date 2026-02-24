const express = require('express');
const router = express.Router();
const kegiatanController = require('../../controllers/ustadz/kegiatanController');

router.get('/', kegiatanController.getKegiatan);
router.post('/', kegiatanController.createKegiatan);
router.put('/:id', kegiatanController.updateKegiatan);

module.exports = router;