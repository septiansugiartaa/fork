const express = require("express");
const router = express.Router();
const createUploader = require("../../middleware/uploadMiddleware"); 
const publicPpdbController = require("../../controllers/ppdb/publicPpdbController");

const uploadDokumenPpdb = createUploader("ppdb/dokumen", "ppdb");

router.get("/gelombang", publicPpdbController.getGelombangAktif);
router.post("/daftar", publicPpdbController.submitPendaftaran);
router.post("/dokumen/:no_pendaftaran", uploadDokumenPpdb.single("file"), publicPpdbController.uploadDokumen);
router.get("/status/:no_pendaftaran", publicPpdbController.cekStatusPendaftaran);
router.post("/lupa-nomor", publicPpdbController.lupaNomorPendaftaran);

module.exports = router;