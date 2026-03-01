const express = require("express");
const router = express.Router();
const screeningController = require("../../controllers/timkesehatan/screeningController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================
   SETUP FOLDER UPLOAD
========================= */
const uploadPath = path.join(__dirname, "../../../public/uploads/screening");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

/* =========================
   STORAGE
========================= */
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
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

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


router.get("/santri", screeningController.getSantriList);
router.get("/santri/:id/detail", screeningController.getSantriDetail);
router.get("/santri/:id/screening", screeningController.getScreeningBySantri);
router.get("/pertanyaan", screeningController.getPertanyaan);
router.get("/penanganan", screeningController.getPenanganan);
router.get("/:id", screeningController.getDetailScreening);
router.get("/santri/:id/latest", screeningController.getLatestScreening);
router.post(
  "/create",
  upload.single("foto"),
  screeningController.postScreening
);
router.put(
  "/:id/foto",
  upload.single("foto"),
  screeningController.updateFotoPredileksi
);

module.exports = router;