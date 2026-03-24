const express = require("express");
const router = express.Router();

const absensiController = require("../../controllers/timkesehatan/absensiController");

router.get(
  "/kamar",
  absensiController.getKamarList
);

router.get(
  "/kamar/:id/detail",
  absensiController.getKamarDetail
);

router.get(
  "/kamar/:id/absensi",
  absensiController.getAbsensiByKamar
);

router.get(
  "/kamar/:id/latest",
  absensiController.getLatestAbsensi
);

router.get(
  "/kamar/:id/santri",
  absensiController.getSantriByKamar
);

router.get(
  "/item-kebersihan",
  absensiController.getItemKebersihan
);

router.get(
  "/kamar/:id/laporan",
  absensiController.getLaporanAbsensi
);

router.get(
  "/:id_heading",
  absensiController.getAbsensiDetail
);


router.post(
  "/create",
  absensiController.createAbsensi
);

router.put(
  "/update/:id_heading",
  absensiController.updateAbsensi
);

module.exports = router;