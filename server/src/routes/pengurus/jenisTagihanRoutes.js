const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/masterDataController');

router.use(requireRole('pengurus'));

router.get('/',       ctrl.getAllTagihan);
router.post('/',      ctrl.createTagihanJenis);
router.put('/:id',    ctrl.updateTagihanJenis);
router.delete('/:id', ctrl.removeTagihanJenis);

module.exports = router;
