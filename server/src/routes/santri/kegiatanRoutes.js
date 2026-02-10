const express = require('express');
const router = express.Router();
const kegiatanController = require('../../controllers/santri/kegiatanController');

router.use(kegiatanController.verifyToken);

router.get('/', kegiatanController.getKegiatan);
router.post('/feedback', kegiatanController.submitFeedback);

module.exports = router;