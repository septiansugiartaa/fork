const express = require('express');
const router = express.Router();
const kegiatanController = require('../../controllers/pengurus/kegiatanController');

router.get('/', kegiatanController.getKegiatan);
router.post('/', kegiatanController.createKegiatan);
router.put('/:id', kegiatanController.updateKegiatan);
router.delete('/:id', kegiatanController.deleteKegiatan);

module.exports = router;