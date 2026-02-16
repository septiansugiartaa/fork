const express = require("express");
const router = express.Router();
const keuanganController = require("../../controllers/santri/keuanganController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- Config Multer (Upload Folder: public/uploads/payments) ---
const uploadDir = path.join(__dirname, "../../../public/uploads/payments");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "pay-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    if (allowedTypes.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error("Format file tidak valid (Gunakan JPG, PNG, atau PDF)"));
  },
});

router.get("/", keuanganController.getKeuanganDashboard);

// Route Upload Pembayaran
router.post(
  "/bayar",
  upload.single("bukti_bayar"),
  keuanganController.uploadPembayaran,
);

module.exports = router;
