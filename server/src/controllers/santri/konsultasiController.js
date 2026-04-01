const konsultasiService = require('../shared/konsultasiService');

const handleError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({ success: false, message: error.message || 'Terjadi kesalahan pada server.' });
};

exports.getTimkes = async (req, res) => {
  try {
    const data = await konsultasiService.getTimkesList();
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getCurrentRoom = async (req, res) => {
  try {
    const data = await konsultasiService.getCurrentRoomBySantri(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("ERROR CURRENT ROOM:", error);
    return handleError(res, error);
  }
};

exports.createRoom = async (req, res) => {
  try {
    const id_timkes = Number(req.body.id_timkes);
    if (!id_timkes) {
      return res.status(400).json({ success: false, message: 'Tim kesehatan wajib dipilih.' });
    }

    const data = await konsultasiService.createRoom({ santriId: req.user.id, timkesId: id_timkes });
    return res.status(201).json({ success: true, data, message: 'Room konsultasi berhasil dibuat.' });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getRoomDetail = async (req, res) => {
  try {
    const data = await konsultasiService.getRoomById(req.params.id, req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const data = await konsultasiService.getRoomMessages(req.params.id, req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const data = await konsultasiService.sendMessage({
      roomId: req.params.id,
      senderId: req.user.id,
      senderRole: 'santri',
      messageText: req.body.message,
    });
    return res.status(201).json({ success: true, data, message: 'Pesan terkirim.' });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.closeRoom = async (req, res) => {
  try {
    const data = await konsultasiService.closeRoom({
      roomId: req.params.id,
      userId: req.user.id,
      userRole: 'santri',
      reasonText: req.body.reason_text,
    });
    return res.json({ success: true, data, message: 'Konsultasi ditutup.' });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await konsultasiService.listRoomHistory({ userId: req.user.id, userRole: 'santri' });
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

exports.markRead = async (req, res) => {
  try {
    const last_read_message_id = Number(req.body.last_read_message_id);
    if (!last_read_message_id) {
      return res.status(400).json({ success: false, message: 'last_read_message_id wajib diisi.' });
    }

    await konsultasiService.markRead({ roomId: req.params.id, userId: req.user.id, lastReadMessageId: last_read_message_id });
    return res.json({ success: true, message: 'Status baca diperbarui.' });
  } catch (error) {
    return handleError(res, error);
  }
};
