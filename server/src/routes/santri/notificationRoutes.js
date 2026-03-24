const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/santri/notificationController');

router.get('/', notificationController.getSantriNotifs);
router.put('/read', notificationController.markAsRead);
module.exports = router;