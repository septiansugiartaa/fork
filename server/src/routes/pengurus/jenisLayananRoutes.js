const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/masterDataController');

router.use(requireRole('pengurus'));

router.get('/',       ctrl.getJenisLayanan);
router.post('/',      ctrl.createJenisLayanan);
router.put('/:id',    ctrl.updateJenisLayanan);
router.delete('/:id', ctrl.deleteJenisLayanan);

module.exports = router;
