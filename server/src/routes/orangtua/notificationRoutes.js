const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/orangtua/notificationController');

router.get('/', notificationController.getOrtuNotifs);
router.put('/read', notificationController.markAsRead);
module.exports = router;