const express = require('express');
const { requireRole } = require('../../middleware/verifyToken');
const controller = require('../../controllers/timkesehatan/konsultasiController');

const router = express.Router();

router.use(requireRole('timkesehatan'));

router.get('/rooms/active', controller.getActiveRooms);
router.get('/rooms/history', controller.getHistory);
router.get('/rooms/:id', controller.getRoomDetail);
router.get('/rooms/:id/messages', controller.getMessages);
router.get('/rooms/:id/health-summary', controller.getHealthSummary);
router.post('/rooms/:id/messages', controller.sendMessage);
router.post('/rooms/:id/close', controller.closeRoom);
router.post('/rooms/:id/read', controller.markRead);

module.exports = router;
