const express = require('express');
const router = express.Router();
const feedbackController = require('../../controllers/admin/feedbackController');

router.get('/', feedbackController.getFeedbackSummary);
router.get('/detail/:type/:id', feedbackController.getFeedbackDetail);
router.put('/hide/:idFeedback', feedbackController.hideFeedback);

module.exports = router;