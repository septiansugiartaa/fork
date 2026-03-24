const express = require("express");
const router = express.Router();
const adminPpdbController = require("../../controllers/ppdb/adminPpdbController");

// Gelombang PPDB
router.get("/tahun", adminPpdbController.getAllTahun);
router.get("/tahun/:id", adminPpdbController.getTahunById);
router.post("/tahun", adminPpdbController.createTahun);
router.put("/tahun/:id", adminPpdbController.updateTahun);
router.delete("/tahun/:id", adminPpdbController.deleteTahun);

router.get("/dashboard", adminPpdbController.getDashboardStats);

router.get("/pendaftar", adminPpdbController.getAllPendaftar);
router.get("/pendaftar/:id", adminPpdbController.getPendaftarById);
router.post("/pendaftar", adminPpdbController.createPendaftarManual);
router.patch("/pendaftar/:id/status", adminPpdbController.updateStatusPendaftar);
router.post("/pendaftar/:id/aktivasi", adminPpdbController.aktivasiSantri);

router.patch("/dokumen/:id_dokumen/verifikasi", adminPpdbController.verifikasiDokumen);

module.exports = router;
