const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const { verifyToken, requireRole } = require('../../middleware/verifyToken');
const ctrl = require('../../controllers/timkesehatan/pengajuanMateriController');

const uploadPath = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Format file tidak didukung. Gunakan jpg, jpeg, png, atau webp'), false);
};

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter });

const uploadSingle = (req, res, next) => {
  upload.single('gambar')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Ukuran file maksimal 2MB' });
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next();
  verifyToken(req, res, next);
};

// ── ROUTER 1: PUBLIC ─────────────────────────────────────────
// Mount: app.use('/api/public/pengajuanMateri', publicRouter)
const publicRouter = express.Router();
publicRouter.post('/', optionalToken, uploadSingle, ctrl.ajukanMateri);

// ── ROUTER 2: GLOBAL (user login) ────────────────────────────
// Mount: app.use('/api/global/riwayatPengajuanMateri', globalRouter)
const globalRouter = express.Router();
globalRouter.get('/', verifyToken, ctrl.getRiwayatPengajuan);

// ── ROUTER 3: TIMKES ─────────────────────────────────────────
// Mount: app.use('/api/timkesehatan/pengajuanMateri', timkesRouter)
const timkesRouter = express.Router();
timkesRouter.get('/',             verifyToken, requireRole('timkesehatan'), ctrl.getSemuaPengajuan);
timkesRouter.put('/:id',          verifyToken, requireRole('timkesehatan'), uploadSingle, ctrl.editPengajuan);
timkesRouter.post('/:id/setujui', verifyToken, requireRole('timkesehatan'), uploadSingle, ctrl.setujuiPengajuan);
timkesRouter.post('/:id/tolak',   verifyToken, requireRole('timkesehatan'), ctrl.tolakPengajuan);

module.exports = { publicRouter, globalRouter, timkesRouter };