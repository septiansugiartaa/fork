const express = require('express');
const router = express.Router();
const jenisTagihanController = require('../../controllers/admin/jenisTagihanController');

router.get('/', jenisTagihanController.getAll);
router.post('/', jenisTagihanController.create);
router.put('/:id', jenisTagihanController.update);
router.delete('/:id', jenisTagihanController.remove);

module.exports = router;