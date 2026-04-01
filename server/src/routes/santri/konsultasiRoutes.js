const express = require('express');
const { requireRole } = require('../../middleware/verifyToken');
const controller = require('../../controllers/santri/konsultasiController');

const router = express.Router();

router.use(requireRole('santri'));

router.get('/timkes', controller.getTimkes);
router.get('/room/me/current', controller.getCurrentRoom);
router.post('/rooms', controller.createRoom);
router.get('/rooms/history', controller.getHistory);
router.get('/rooms/:id', controller.getRoomDetail);
router.get('/rooms/:id/messages', controller.getMessages);
router.post('/rooms/:id/messages', controller.sendMessage);
router.post('/rooms/:id/close', controller.closeRoom);
router.post('/rooms/:id/read', controller.markRead);

module.exports = router;
