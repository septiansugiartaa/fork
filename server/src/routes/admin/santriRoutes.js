const express    = require('express');
const router     = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl       = require('../../controllers/shared/santriController');

// Semua route di sini hanya bisa diakses oleh role 'admin'
router.use(requireRole('admin'));

router.get('/',            ctrl.getSantri);
router.get('/:id/ortu',   ctrl.getOrtuBySantri);
router.post('/',           ctrl.createSantri);
router.put('/:id',         ctrl.updateSantri);
router.delete('/:id',      ctrl.deleteSantri);

module.exports = router;
