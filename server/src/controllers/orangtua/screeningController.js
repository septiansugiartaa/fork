const { PrismaClient } = require("@prisma/client");
const { createScreeningController } = require("../shared/sharedScreeningController");

const prisma = new PrismaClient();
const sharedController = createScreeningController({ writableRoles: [] });

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

const getLinkedSantriIdFromScreening = async (screeningId) => {
  const screening = await prisma.screening.findUnique({
    where: { id_screening: Number(screeningId) },
    select: { id_santri: true },
  });

  return screening?.id_santri || null;
};

exports.getSantriDetail = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getSantriDetail(req, res);
};

exports.getScreeningBySantri = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getScreeningBySantri(req, res);
};

exports.getLatestScreening = async (req, res) => {
  if (!(await ensureParentHasAccess(req.user.id, req.params.id))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getLatestScreening(req, res);
};

exports.getDetailScreening = async (req, res) => {
  const santriId = await getLinkedSantriIdFromScreening(req.params.id);
  if (!santriId || !(await ensureParentHasAccess(req.user.id, santriId))) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  return sharedController.getDetailScreening(req, res);
};
