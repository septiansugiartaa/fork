const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Whitelist MIME type yang benar-benar diizinkan.
// Sebelumnya regex `/jpeg|jpg|png|pdf/` bisa ditipu oleh file bernama
// "exploit.pdf.exe" karena regex hanya cek substring di extname.
// Sekarang kita validasi MIME type yang sesungguhnya dari file header.
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);

/**
 * Factory untuk membuat uploader Multer per subfolder.
 *
 * @param {string} subFolder   - Subfolder di dalam public/uploads/
 * @param {string} filePrefix  - Prefix nama file yang disimpan
 */
const createUploader = (subFolder, filePrefix = 'file') => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join('public/uploads/', subFolder);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const userId      = req.user ? req.user.id : 'guest';
            const uniqueSuffix = Date.now();
            const ext         = path.extname(file.originalname).toLowerCase();
            cb(null, `${filePrefix}-${userId}-${uniqueSuffix}${ext}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        const ext      = path.extname(file.originalname).toLowerCase();
        const mimeOk   = ALLOWED_MIME_TYPES.has(file.mimetype);
        const extOk    = ALLOWED_EXTENSIONS.has(ext);

        // Kedua kondisi harus terpenuhi — MIME type DAN ekstensi harus cocok
        if (mimeOk && extOk) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung. Hanya JPEG, PNG, dan PDF yang diizinkan.'));
        }
    };

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter,
    });
};

module.exports = createUploader;
