const express = require('express');
const router = express.Router();
const viewMateriController = require('../controllers/viewMateriController');

// Route Materi List
router.get('/', viewMateriController.getViewMateri);

module.exports = router;