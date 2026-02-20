const express = require("express");
const router = express.Router();
const pendataanController = require("../../controllers/orangtua/pendataanController");
const createUploader = require('../../middleware/uploadMiddleware');

router.get("/", pendataanController.getProfile);
router.put("/update", pendataanController.updateProfile);
router.put("/password", pendataanController.updatePassword);

const uploadProfil = createUploader('profil', 'foto');
router.post('/photo', uploadProfil.single('foto'), pendataanController.updatePhoto);

module.exports = router;