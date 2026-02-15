const express = require('express');
const router = express.Router();
const ustadzController = require('../../controllers/pengurus/ustadzController');

router.get('/', ustadzController.getUstadz);
router.post('/', ustadzController.createUstadz);
router.put('/:id', ustadzController.updateUstadz);
router.delete('/:id', ustadzController.deleteUstadz);

module.exports = router;