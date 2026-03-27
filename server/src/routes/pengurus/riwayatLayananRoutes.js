const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/masterDataController');

router.use(requireRole('pengurus'));

router.get('/',    ctrl.getRiwayatLayanan);
router.put('/:id', ctrl.updateStatusLayanan);

module.exports = router;
