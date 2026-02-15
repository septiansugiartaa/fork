const express = require('express');
const router = express.Router();
const santriController = require('../../controllers/pengurus/santriController');

router.get('/', santriController.getSantri);
router.post('/', santriController.createSantri);
router.put('/:id', santriController.updateSantri);
router.delete('/:id', santriController.deleteSantri);

module.exports = router;