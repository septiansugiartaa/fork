const express = require('express');
const router = express.Router();
const pendataanController = require('../../controllers/santri/pendataanController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Konfigurasi Multer (Upload) ---
// Pastikan path ini benar relatif dari file route ini
// Routes ada di: src/routes/santri/
// Public ada di: public/uploads/
const uploadDir = path.join(__dirname, '../../../public/uploads');

// Buat folder jika belum ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
        // Format: profile-{userID}-{timestamp}.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Hanya diperbolehkan format gambar (jpg, jpeg, png)!'));
    }
});

// --- Middleware Global ---
router.use(pendataanController.verifyToken);

// --- Routes ---
router.get('/', pendataanController.getProfile);
router.put('/update', pendataanController.updateProfile);
router.put('/password', pendataanController.updatePassword);

// 'foto' adalah key FormData dari Frontend
router.post('/photo', upload.single('foto'), pendataanController.updatePhoto);

router.post('/orangtua', pendataanController.addOrangTua);
router.get('/orangtua/search', pendataanController.searchUser);
router.put('/orangtua/:id', pendataanController.updateOrangTua);
router.delete('/orangtua/:id', pendataanController.deleteOrangTua);

module.exports = router;