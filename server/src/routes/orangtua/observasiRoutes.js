const express = require("express");
const observasiController = require("../../controllers/orangtua/observasiController");

const router = express.Router();

router.get("/santri/:id/detail", observasiController.getSantriDetail);
router.get("/santri/:id/observasi", observasiController.getObservasiBySantri);
router.get("/santri/:id/latest", observasiController.getLatestObservasi);
router.get("/:id", observasiController.getDetailObservasi);

module.exports = router;
