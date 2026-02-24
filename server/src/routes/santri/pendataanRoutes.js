const express = require("express");
const router = express.Router();
const pendataanController = require("../../controllers/santri/pendataanController");
const createUploader = require('../../middleware/uploadMiddleware');


router.get("/", pendataanController.getProfile);
router.put("/update", pendataanController.updateProfile);
router.put("/password", pendataanController.updatePassword);

const uploadProfil = createUploader('profil', 'foto');
router.post('/photo', uploadProfil.single('foto'), pendataanController.updatePhoto);

router.post("/orangtua", pendataanController.addOrangTua);
router.get("/orangtua/search", pendataanController.searchUser);
router.put("/orangtua/:id", pendataanController.updateOrangTua);
router.delete("/orangtua/:id", pendataanController.deleteOrangTua);

module.exports = router;
