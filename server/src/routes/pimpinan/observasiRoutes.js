const express = require("express");
const router = express.Router();
const observasiController = require("../../controllers/pimpinan/observasiController");

router.get("/santri", observasiController.getSantriList);
router.get("/santri/:id/detail", observasiController.getSantriDetail);
router.get("/santri/:id/observasi", observasiController.getObservasiBySantri);
router.get("/santri/:id/latest", observasiController.getLatestObservasi);
router.get("/pertanyaan", observasiController.getPertanyaan);
router.get("/waktu", observasiController.getWaktuOptions);
router.get("/tindak-lanjut", observasiController.getTindakLanjut);
router.get("/:id", observasiController.getDetailObservasi);

module.exports = router;