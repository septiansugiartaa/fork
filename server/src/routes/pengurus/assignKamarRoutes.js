const express = require('express');
const router = express.Router();
const kamarController = require('../../controllers/pengurus/kamarController');

router.get('/', kamarController.getAssignKamar);
router.get('/options', kamarController.getOptions);
router.post('/', kamarController.createAssignKamar);
router.delete('/:id', kamarController.deleteAssignKamar);

module.exports = router;