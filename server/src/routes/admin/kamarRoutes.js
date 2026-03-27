const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/kamarController');

router.use(requireRole('admin'));

router.get('/',                              ctrl.getKamar);
router.get('/:id/santri',                    ctrl.getSantriByKamar);
router.post('/',                             ctrl.createKamar);
router.put('/:id',                           ctrl.updateKamar);
router.delete('/:id',                        ctrl.deleteKamar);
router.delete('/:idKamar/santri/:idSantri',  ctrl.removeSantriFromKamar);

module.exports = router;
