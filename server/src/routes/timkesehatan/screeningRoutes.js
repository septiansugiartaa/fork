const express = require("express");
const router = express.Router();
const screeningController = require("../../controllers/timkesehatan/screeningController");

router.get("/santri", screeningController.getSantriList);
router.get("/santri/:id/detail", screeningController.getSantriDetail);
router.get("/santri/:id/screening", screeningController.getScreeningBySantri);
router.get("/santri/:id/latest", screeningController.getLatestScreening);

router.get("/pertanyaan", screeningController.getPertanyaan);
router.get("/penanganan", screeningController.getPenanganan);

router.post("/create", screeningController.postScreening);
router.get("/:id", screeningController.getDetailScreening);

module.exports = router;