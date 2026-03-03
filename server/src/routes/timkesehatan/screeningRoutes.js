const express = require("express");
const router = express.Router();
const screeningController = require("../../controllers/timkesehatan/screeningController");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadPath = path.join(__dirname, "../../../public/uploads/screening");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format file tidak didukung"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});

router.get("/santri", screeningController.getSantriList);
router.get("/santri/:id/detail", screeningController.getSantriDetail);
router.get("/santri/:id/screening", screeningController.getScreeningBySantri);
router.get("/santri/:id/latest", screeningController.getLatestScreening);

router.get("/pertanyaan", screeningController.getPertanyaan);
router.get("/penanganan", screeningController.getPenanganan);

router.get("/:id", screeningController.getDetailScreening);

router.post("/create", upload.single("foto"), screeningController.postScreening);
router.put("/:id/foto", upload.single("foto"), screeningController.updateFotoPredileksi);

module.exports = router;