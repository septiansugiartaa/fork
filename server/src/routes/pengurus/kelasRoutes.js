const express = require('express');
const router = express.Router();
const kelasController = require('../../controllers/pengurus/kelasController');

router.get('/', kelasController.getKelas);
router.get('/wali', kelasController.getWaliOptions);
router.get('/:id/santri', kelasController.getSantriByKelas); // New Route
router.post('/', kelasController.createKelas);
router.put('/:id', kelasController.updateKelas);
router.delete('/:id', kelasController.deleteKelas);
router.delete('/:idKelas/santri/:idSantri', kelasController.removeSantriFromKelas);

module.exports = router;