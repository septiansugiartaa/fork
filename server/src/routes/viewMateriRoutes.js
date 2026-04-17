const express = require('express');
const router = express.Router();
const viewMateriController = require('../controllers/viewMateriController');
const manageMateriController = require('../controllers/manageMateriController');

// Route Materi List
router.get('/', viewMateriController.getViewMateri);
router.get('/:id', manageMateriController.getDetailMateri);

module.exports = router;