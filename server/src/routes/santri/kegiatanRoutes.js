const express = require('express');
const router = express.Router();
const kegiatanController = require('../../controllers/santri/kegiatanController');

router.get('/', kegiatanController.getKegiatan);
router.post('/feedback', kegiatanController.submitFeedback);

module.exports = router;