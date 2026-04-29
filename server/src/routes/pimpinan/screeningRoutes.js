const express = require("express");
const screeningController = require("../../controllers/pimpinan/screeningController");

const router = express.Router();

router.get("/santri", screeningController.getSantriList);
router.get("/santri/:id/detail", screeningController.getSantriDetail);
router.get("/santri/:id/screening", screeningController.getScreeningBySantri);
router.get("/santri/:id/latest", screeningController.getLatestScreening);
router.get("/pertanyaan", screeningController.getPertanyaan);
router.get("/penanganan", screeningController.getPenanganan);
router.get("/:id", screeningController.getDetailScreening);

module.exports = router;
