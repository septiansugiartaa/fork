const express = require("express");
const router = express.Router();
const panitiaPpdbController = require("../../controllers/ppdb/panitiaPpdbController");

// Seleksi
router.get("/seleksi", panitiaPpdbController.getAllPendaftarSeleksi);
router.get("/seleksi/:id_pendaftar", panitiaPpdbController.getDetailSeleksi);
router.post("/seleksi/:id_pendaftar", panitiaPpdbController.simpanHasilSeleksi);

// Rekap & Pengumuman
router.get("/rekap/:id_tahun", panitiaPpdbController.getRekap);
router.post("/pengumuman/:id_tahun", panitiaPpdbController.publishPengumuman);

module.exports = router;
