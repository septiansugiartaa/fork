const express = require('express');
const router = express.Router();
const ustadzController = require('../../controllers/pimpinan/ustadzController');

router.get('/', ustadzController.getUstadz);

module.exports = router;