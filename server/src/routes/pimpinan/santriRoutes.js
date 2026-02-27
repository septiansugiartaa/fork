const express = require('express');
const router = express.Router();
const santriController = require('../../controllers/pimpinan/santriController');

router.get('/', santriController.getSantri);

module.exports = router;