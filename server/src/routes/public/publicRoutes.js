const express = require("express");
const router = express.Router();
const publicController = require("../../controllers/public/publicController");

router.get("/stats", publicController.getLandingStats);

module.exports = router;
