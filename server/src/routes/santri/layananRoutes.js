const express = require('express');
const router = express.Router();
const layananController = require('../../controllers/santri/layananController');

router.get('/', layananController.getDaftarLayanan);
router.get('/context', layananController.getUserContext);
router.post('/ajukan', layananController.ajukanLayanan);

module.exports = router;