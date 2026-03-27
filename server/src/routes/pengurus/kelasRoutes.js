const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/kelasController');

router.use(requireRole('pengurus'));

router.get('/',                              ctrl.getKelas);
router.get('/wali-options',                  ctrl.getWaliOptions);
router.get('/:id/santri',                    ctrl.getSantriByKelas);
router.post('/',                             ctrl.createKelas);
router.put('/:id',                           ctrl.updateKelas);
router.delete('/:id',                        ctrl.deleteKelas);
router.delete('/:idKelas/santri/:idSantri',  ctrl.removeSantriFromKelas);

module.exports = router;
