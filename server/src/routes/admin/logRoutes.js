const express = require('express');
const router = express.Router();
const logController = require('../../controllers/admin/logController');

router.get('/roles', logController.getUniqueRoles);
router.get('/', logController.getAllLogs);

module.exports = router;