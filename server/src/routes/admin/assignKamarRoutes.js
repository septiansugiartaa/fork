const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/kamarController');

router.use(requireRole('admin'));

router.get('/',        ctrl.getAssignKamar);
router.get('/options', ctrl.getOptions);
router.post('/',       ctrl.createAssignKamar);
router.delete('/:id',  ctrl.deleteAssignKamar);

module.exports = router;
