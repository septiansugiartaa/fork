const express = require('express');
const router  = express.Router();
const { requireRole } = require('../../middleware/verifyToken');
const ctrl    = require('../../controllers/shared/masterDataController');

router.use(requireRole('admin'));

router.get('/tagihan', ctrl.getTagihan);
router.get('/options', ctrl.getKeuanganOptions);
router.get('/:idTagihan/pembayaran', ctrl.getPembayaranByTagihan);
router.post('/', ctrl.createTagihan);
router.put('/:id', ctrl.updateTagihan);
router.put('/:id/status', ctrl.updateStatusTagihan);
router.put('/pembayaran/:id/verifikasi', ctrl.verifyPembayaran);
router.delete('/:id', ctrl.deleteTagihan);

module.exports = router;
