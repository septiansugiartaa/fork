const express = require('express');
const router = express.Router();
const kelasController = require('../../controllers/admin/kelasController');

router.get('/', kelasController.getAssignKelas);
router.get('/options', kelasController.getOptions);
router.post('/', kelasController.createAssignKelas);
router.put('/:id', kelasController.updateAssignKelas);
router.delete('/:id', kelasController.deleteAssignKelas);

module.exports = router;