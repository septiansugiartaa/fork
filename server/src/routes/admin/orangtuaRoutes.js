const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/orangtuaController');

router.get('/search', controller.searchUser);
router.post('/assign', controller.assignRelasi);
router.delete('/assign/:id_relasi', controller.removeRelasi);

router.get('/:id/anak', controller.getAnakByOrtu);

router.get('/', controller.getOrangTua);
router.post('/', controller.createOrangTua);
router.put('/:id', controller.updateOrangTua);
router.delete('/:id', controller.deleteOrangTua);

module.exports = router;