const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/ustadzController');

router.use(requireRole('admin'));

router.get('/',       ctrl.getUstadz);
router.post('/',      ctrl.createUstadz);
router.put('/:id',    ctrl.updateUstadz);
router.delete('/:id', ctrl.deleteUstadz);

module.exports = router;
