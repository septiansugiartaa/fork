const express = require('express');
const router = express.Router();
const manageMateriController = require('../controllers/manageMateriController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung. Gunakan jpg, jpeg, png, atau webp"), false);
  }
};

const upload = multer({ 
    storage, 
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }, 
    fileFilter 
});

// Route Materi List
router.get('/', manageMateriController.getViewMateri);
router.post('/', (req, res, next) => {
  upload.single("gambar")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // error dari multer (size dll)
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
            success: false,
            message: "Ukuran file maksimal 2MB"
            });
        }
    } else if (err) {
      // error dari fileFilter
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
  });
}, manageMateriController.postManageMateri);

router.put('/:id', upload.single("gambar"), manageMateriController.putManageMateri);
router.delete('/:id', manageMateriController.deleteManageMateri);

module.exports = router;