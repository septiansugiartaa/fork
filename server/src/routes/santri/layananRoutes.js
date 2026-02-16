const express = require('express');
const router = express.Router();
const layananController = require('../../controllers/santri/layananController');

router.get('/', layananController.getDaftarLayanan);
router.post('/ajukan', layananController.ajukanLayanan);

module.exports = router;