const { PrismaClient } = require("@prisma/client");
const { createObservasiController } = require("../shared/sharedObservasiController");

const prisma = new PrismaClient();
const sharedController = createObservasiController({ writableRoles: [] });

const ensureParentHasAccess = async (parentUserId, santriId) => {
  const relation = await prisma.orangtua.findFirst({
    where: {
      id_orangtua: Number(parentUserId),
      id_santri: Number(santriId),
      is_active: true,
    },
  });

  return Boolean(relation);
};

const getLinkedSantriIdFromObservasi = async (observasiId) => {
  const observasi = await prisma.observasi.findUnique({
    where: { id_observasi: Number(observasiId) },
    select: { id_santri: true },
  });

  return observasi?.id_santri || null;
};

exports.getSantriDetail = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getSantriDetail(req, res);
};

exports.getObservasiBySantri = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getObservasiBySantri(req, res);
};

exports.getLatestObservasi = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getLatestObservasi(req, res);
};

exports.getDetailObservasi = async (req, res) => {
  const santriId = await getLinkedSantriIdFromObservasi(req.params.id);
  if (!santriId || !(await ensureParentHasAccess(req.user.id, santriId))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getDetailObservasi(req, res);
};
