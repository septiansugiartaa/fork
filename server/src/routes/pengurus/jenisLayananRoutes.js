const express = require('express');
const router = express.Router();
const jenisLayananController = require('../../controllers/pengurus/jenisLayananController');

router.get('/', jenisLayananController.getJenisLayanan);
router.post('/', jenisLayananController.createJenisLayanan);
router.put('/:id', jenisLayananController.updateJenisLayanan);
router.delete('/:id', jenisLayananController.deleteJenisLayanan);

module.exports = router;