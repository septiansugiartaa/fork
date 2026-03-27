const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/orangtuaController');

router.use(requireRole('admin'));

router.get('/',                    ctrl.getOrangTua);
router.get('/search',              ctrl.searchUser);
router.get('/:id/anak',            ctrl.getAnakByOrtu);
router.post('/',                   ctrl.createOrangTua);
router.post('/relasi',             ctrl.assignRelasi);
router.put('/:id',                 ctrl.updateOrangTua);
router.delete('/:id',              ctrl.deleteOrangTua);
router.delete('/relasi/:id_relasi',ctrl.removeRelasi);

module.exports = router;
