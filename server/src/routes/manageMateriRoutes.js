const express = require('express');
const router = express.Router();
const manageMateriController = require('../controllers/manageMateriController');

// Route Materi List
router.get('/', manageMateriController.getViewMateri);
router.post('/', manageMateriController.postManageMateri);
router.put('/:id', manageMateriController.putManageMateri);
router.delete('/:id', manageMateriController.deleteManageMateri);

module.exports = router;