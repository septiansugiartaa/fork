const express = require('express');
const router = express.Router();
const kegiatanController = require('../../controllers/orangtua/kegiatanController');

router.get('/', kegiatanController.getKegiatanAnak);

module.exports = router;