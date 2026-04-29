const express = require("express");
const screeningController = require("../../controllers/orangtua/screeningController");

const router = express.Router();

router.get("/santri/:id/detail", screeningController.getSantriDetail);
router.get("/santri/:id/screening", screeningController.getScreeningBySantri);
router.get("/santri/:id/latest", screeningController.getLatestScreening);
router.get("/:id", screeningController.getDetailScreening);

module.exports = router;
