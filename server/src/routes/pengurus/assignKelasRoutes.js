const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/kelasController');

router.use(requireRole('pengurus'));

router.get('/',        ctrl.getAssignKelas);
router.get('/options', ctrl.getOptions);
router.post('/',       ctrl.createAssignKelas);
router.put('/:id',     ctrl.updateAssignKelas);
router.delete('/:id',  ctrl.deleteAssignKelas);

module.exports = router;
