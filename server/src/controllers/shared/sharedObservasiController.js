const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_TINDAK_LANJUT = [
  { id: 1, value: "Edukasi_Ulang_Cuci_Tangan_6_Langkah_WHO", label: "Edukasi ulang cuci tangan 6 langkah WHO", isCustom: false },
  { id: 2, value: "Pendampingan_Langsung_Tim_Kesehatan", label: "Pendampingan langsung tim kesehatan", isCustom: false },
  { id: 3, value: "Pemberian_Contoh_Oleh_Ketua_Kamar", label: "Pemberian contoh oleh ketua kamar", isCustom: false },
  { id: 4, value: "Lainnya", label: "Lainnya", isCustom: true }
];

const OBSERVASI_WAKTU_OPTIONS = [
  { value: "Pagi", label: "Pagi" },
  { value: "Siang", label: "Siang" },
  { value: "Sore", label: "Sore" },
  { value: "Malam", label: "Malam" }
];

const safeParseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseSubmittedTindakLanjut = (value, fallbackCustomText = "") => {
  if (Array.isArray(value)) {
    return {
      selected: value,
      customText: fallbackCustomText
    };
  }

  if (value && typeof value === "object") {
    return {
      selected: safeParseArray(value.selected),
      customText: (value.customText || value.lainnya || fallbackCustomText || "").toString().trim()
    };
  }

  return {
    selected: safeParseArray(value),
    customText: fallbackCustomText
  };
};

const toEnumValue = (value = "") => value
  .toString()
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "") || "LAINNYA";

const getObservasiCategory = (score = 0) => {
  if (score >= 6) return "Baik";
  if (score >= 4) return "Cukup";
  return "Kurang";
};

const parseTindakLanjut = (value) => {
  if (!value) return { selected: [], customText: "" };

  if (typeof value === "object") {
    return {
      selected: Array.isArray(value.selected) ? value.selected : [],
      customText: value.customText || ""
    };
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return {
          selected: Array.isArray(parsed.selected) ? parsed.selected : [],
          customText: parsed.customText || ""
        };
      }
    } catch {
      return {
        selected: value.split(",").map((item) => item.trim()).filter(Boolean),
        customText: ""
      };
    }
  }

  return { selected: [], customText: "" };
};

const getStoredTindakLanjutValue = (observasi) => {
  if (observasi?.tindak_lanjut) return observasi.tindak_lanjut;

  const detail = Array.isArray(observasi?.detail_observasi) ? observasi.detail_observasi : [];
  const metaDetail = detail.find((item) => item.tindak_lanjut) || null;
  return metaDetail?.tindak_lanjut || null;
};

const getStoredCatatanValue = (observasi) => {
  if (observasi?.catatan) return observasi.catatan;

  const detail = Array.isArray(observasi?.detail_observasi) ? observasi.detail_observasi : [];
  const metaDetail = detail.find((item) => item.catatan) || null;
  return metaDetail?.catatan || "";
};

const deriveObservasiSummary = (observasi) => {
  const detail = Array.isArray(observasi.detail_observasi) ? observasi.detail_observasi : [];
  const totalSkor = typeof observasi.skor_diperoleh === "number"
    ? observasi.skor_diperoleh
    : detail.reduce((sum, item) => sum + (item.jawaban ? 1 : 0), 0);
  const kategori = getObservasiCategory(totalSkor);
  const tindakLanjut = parseTindakLanjut(getStoredTindakLanjutValue(observasi));
  const filteredTindakLanjut = tindakLanjut.selected.filter((item) => item !== "LAINNYA");

  return {
    ...observasi,
    total_skor: totalSkor,
    kategori_skor: kategori,
    skor_label: `${totalSkor} - ${kategori}`,
    catatan_pengamat: getStoredCatatanValue(observasi),
    tindak_lanjut: filteredTindakLanjut,
    tindak_lanjut_lainnya: tindakLanjut.customText || ""
  };
};

const getActiveSantriWhere = (search = "") => {
  const where = {
    is_active: true,
    user_role: {
      some: { id_role: 1, is_active: true }
    }
  };

  if (search.trim()) {
    where.OR = [
      { nama: { contains: search } },
      { nip: { contains: search } }
    ];
  }

  return where;
};

const normalizeTindakLanjutOptions = (rows = []) => {
  const normalized = rows.map((item, index) => {
    const label = item.opsi_tindak_lanjut
      || item.nama_tindak_lanjut
      || item.tindak_lanjut
      || item.nama
      || item.label
      || `Tindak lanjut ${index + 1}`;

    const rawValue = item.kode || item.value || item.enum_value || label;
    const normalizedValue = toEnumValue(rawValue);

    return {
      id: Number(item.id_tindak_lanjut_observasi || item.id || index + 1),
      value: normalizedValue,
      label,
      isCustom: normalizedValue === "LAINNYA"
    };
  });

  const withoutDuplicate = normalized.filter((item, index, array) =>
    array.findIndex((candidate) => candidate.value === item.value) === index
  );

  if (!withoutDuplicate.some((item) => item.value === "LAINNYA")) {
    withoutDuplicate.push(DEFAULT_TINDAK_LANJUT[DEFAULT_TINDAK_LANJUT.length - 1]);
  }

  return withoutDuplicate.length > 0 ? withoutDuplicate : DEFAULT_TINDAK_LANJUT;
};

const getTindakLanjutOptions = async () => {
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT * FROM tindak_lanjut_observasi WHERE is_active = true ORDER BY 1 ASC"
    );
    return normalizeTindakLanjutOptions(rows);
  } catch {
    return DEFAULT_TINDAK_LANJUT;
  }
};

const createObservasiController = ({ writableRoles = [] }) => {
  const canWrite = (role) => writableRoles.includes(role);

  return {
    async getSantriList(req, res) {
      try {
        const { search = "", page = 1, limit = 5 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = getActiveSantriWhere(search);

        const [data, total] = await prisma.$transaction([
          prisma.users.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { nama: "asc" },
            select: {
              id: true,
              nama: true,
              nip: true,
              foto_profil: true,
              observasi_observasi_id_santriTousers: {
                take: 1,
                orderBy: { tanggal: "desc" },
                include: {
                  detail_observasi: {
                    where: { is_active: true },
                    select: { jawaban: true }
                  }
                }
              },
              _count: {
                select: {
                  observasi_observasi_id_santriTousers: true
                }
              }
            }
          }),
          prisma.users.count({ where })
        ]);

        const mapped = data.map((item) => {
          const latest = item.observasi_observasi_id_santriTousers?.[0] || null;
          const totalSkor = latest?.detail_observasi?.reduce((sum, detail) => sum + (detail.jawaban ? 1 : 0), 0) || 0;

          return {
            ...item,
            latest_observasi: latest
              ? {
                  tanggal: latest.tanggal,
                  waktu: latest.waktu,
                  total_skor: totalSkor,
                  kategori_skor: getObservasiCategory(totalSkor),
                  skor_label: `${totalSkor} - ${getObservasiCategory(totalSkor)}`
                }
              : null
          };
        });

        res.json({
          success: true,
          data: mapped,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit)
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getSantriDetail(req, res) {
      try {
        const { id } = req.params;
        const santri = await prisma.users.findUnique({
          where: { id: Number(id) },
          include: {
            kelas_santri: {
              where: { is_active: true },
              include: { kelas: true }
            },
            kamar_santri: {
              where: { is_active: true },
              include: { kamar: true }
            }
          }
        });

        if (!santri) {
          return res.status(404).json({ success: false, message: "Santri tidak ditemukan" });
        }

        res.json({
          success: true,
          data: {
            ...santri,
            kelas: santri.kelas_santri?.[0]?.kelas || null,
            kamar: santri.kamar_santri?.[0]?.kamar || null
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getObservasiBySantri(req, res) {
      try {
        const { id } = req.params;
        const { page = 1, limit = 5 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [total, rows] = await Promise.all([
          prisma.observasi.count({
            where: { id_santri: Number(id), is_active: true }
          }),
          prisma.observasi.findMany({
            where: { id_santri: Number(id), is_active: true },
            orderBy: { tanggal: "desc" },
            skip,
            take: Number(limit),
            include: {
              users_observasi_id_timkesTousers: {
                select: { id: true, nama: true }
              },
              detail_observasi: {
                where: { is_active: true },
                orderBy: { id_detail_obsrevasi: "asc" },
                select: {
                  jawaban: true
                }
              }
            }
          })
        ]);

        res.json({
          success: true,
          data: rows.map(deriveObservasiSummary),
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit)
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getLatestObservasi(req, res) {
      try {
        const { id } = req.params;
        const latest = await prisma.observasi.findFirst({
          where: { id_santri: Number(id), is_active: true },
          orderBy: { tanggal: "desc" },
          include: {
            users_observasi_id_timkesTousers: {
              select: { id: true, nama: true }
            },
            detail_observasi: {
              where: { is_active: true },
              orderBy: { id_detail_obsrevasi: "asc" },
              select: {
                jawaban: true
              }
            }
          }
        });

        res.json({ success: true, data: latest ? deriveObservasiSummary(latest) : null });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getPertanyaan(req, res) {
      try {
        const data = await prisma.pertanyaan_observasi.findMany({
          where: { is_active: true },
          orderBy: { id_pertanyaan_observasi: "asc" }
        });

        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getTindakLanjut(req, res) {
      try {
        const data = await getTindakLanjutOptions();
        res.json({ success: true, data });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getWaktuOptions(req, res) {
      try {
        res.json({ success: true, data: OBSERVASI_WAKTU_OPTIONS });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async postObservasi(req, res) {
      try {
        if (!canWrite(req.user.role)) {
          return res.status(403).json({ success: false, message: "Akses ditolak" });
        }

        const id_timkes = req.user.id;
        const id_santri = Number(req.body.id_santri);
        const jawaban = safeParseArray(req.body.jawaban);
        const tindakLanjutInput = parseSubmittedTindakLanjut(
        req.body.tindakLanjut,
        (req.body.tindakLanjutLainnya || "").toString().trim()
        );
        const selectedTindakLanjut = tindakLanjutInput.selected;
        const customText = tindakLanjutInput.customText;
        const catatan = (req.body.catatan || "").toString().trim();
        const waktu = (req.body.waktu || "").toString().trim();

        if (!id_santri) {
          return res.status(400).json({ success: false, message: "Santri tidak valid" });
        }

        if (!OBSERVASI_WAKTU_OPTIONS.some((item) => item.value === waktu)) {
          return res.status(400).json({ success: false, message: "Waktu observasi wajib dipilih" });
        }

        const pertanyaan = await prisma.pertanyaan_observasi.findMany({
          where: { is_active: true },
          orderBy: { id_pertanyaan_observasi: "asc" }
        });

        const pertanyaanIds = pertanyaan.map((item) => item.id_pertanyaan_observasi);
        const jawabanIds = jawaban.map((item) => Number(item.id_pertanyaan_observasi));
        const semuaTerjawab = pertanyaanIds.length > 0
          && pertanyaanIds.every((idPertanyaan) => jawabanIds.includes(idPertanyaan));

        if (!semuaTerjawab) {
          return res.status(400).json({ success: false, message: "Semua pertanyaan observasi wajib dijawab" });
        }

        const normalizedSelected = selectedTindakLanjut.map((item) => toEnumValue(item));
        const hasLainnya = normalizedSelected.includes("LAINNYA");

        if (normalizedSelected.length === 0) {
          return res.status(400).json({ success: false, message: "Minimal pilih 1 tindak lanjut" });
        }

        if (hasLainnya && !customText) {
          return res.status(400).json({ success: false, message: "Tindak lanjut lainnya wajib diisi" });
        }

        const santri = await prisma.users.findFirst({
          where: {
            id: id_santri,
            is_active: true,
            user_role: { some: { id_role: 1, is_active: true } }
          },
          include: {
            kamar_santri: {
              where: { is_active: true },
              include: { kamar: true }
            }
          }
        });

        if (!santri) {
          return res.status(404).json({ success: false, message: "Santri tidak ditemukan" });
        }

        const totalSkor = jawaban.reduce((sum, item) => sum + (item.jawaban === true ? 1 : 0), 0);
        const tindakLanjutPayload = JSON.stringify({
          selected: normalizedSelected,
          customText
        });

        await prisma.$transaction(async (tx) => {
          const observasi = await tx.observasi.create({
            data: {
              id_santri,
              id_timkes,
              id_kamar: santri.kamar_santri?.[0]?.id_kamar || null,
              tanggal: new Date(),
              waktu,
              skor_diperoleh: totalSkor,
              catatan: catatan || null,
              tindak_lanjut: tindakLanjutPayload,
              is_active: true
            }
          });

          await tx.detail_observasi.createMany({
            data: jawaban.map((item) => ({
              id_observasi: observasi.id_observasi,
              id_pertanyaan_observasi: Number(item.id_pertanyaan_observasi),
              jawaban: item.jawaban === true,
              is_active: true
            }))
          });
        });

        res.status(201).json({
          success: true,
          message: `Observasi berhasil disimpan dengan skor ${totalSkor} - ${getObservasiCategory(totalSkor)}`
        });
      } catch (error) {
        console.error("POST OBSERVASI ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    },

    async getDetailObservasi(req, res) {
      try {
        const { id } = req.params;
        const data = await prisma.observasi.findUnique({
          where: { id_observasi: Number(id) },
          include: {
            users_observasi_id_timkesTousers: {
              select: { id: true, nama: true }
            },
            users_observasi_id_santriTousers: {
              select: {
                id: true,
                nama: true,
                nip: true,
                kelas_santri: {
                  where: { is_active: true },
                  include: { kelas: true }
                },
                kamar_santri: {
                  where: { is_active: true },
                  include: { kamar: true }
                }
              }
            },
            detail_observasi: {
              where: { is_active: true },
              orderBy: { id_detail_obsrevasi: "asc" },
              include: {
                pertanyaan_observasi: true
              }
            }
          }
        });

        if (!data) {
          return res.status(404).json({ success: false, message: "Data observasi tidak ditemukan" });
        }

        res.json({ success: true, data: deriveObservasiSummary(data) });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  };
};

module.exports = {
  createObservasiController,
  getObservasiCategory,
  parseTindakLanjut,
  DEFAULT_TINDAK_LANJUT,
  OBSERVASI_WAKTU_OPTIONS
};
