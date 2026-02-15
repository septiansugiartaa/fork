const express = require('express');
const router = express.Router();
const kamarController = require('../../controllers/pengurus/kamarController');

router.get('/', kamarController.getKamar);
router.get('/:id/santri', kamarController.getSantriByKamar);
router.post('/', kamarController.createKamar);
router.put('/:id', kamarController.updateKamar);
router.delete('/:id', kamarController.deleteKamar);
router.delete('/:idKamar/santri/:idSantri', kamarController.removeSantriFromKamar);

module.exports = router;