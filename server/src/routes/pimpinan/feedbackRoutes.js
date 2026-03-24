const express = require('express');
const router = express.Router();
const feedbackController = require('../../controllers/pimpinan/feedbackController');

router.get('/', feedbackController.getFeedbackSummary);
router.get('/detail/:type/:id', feedbackController.getFeedbackDetail);

module.exports = router;