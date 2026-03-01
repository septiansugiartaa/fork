const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/ustadz/notificationController');

router.get('/', notificationController.getUstadzNotifs);
router.put('/read', notificationController.markAsRead);
module.exports = router;