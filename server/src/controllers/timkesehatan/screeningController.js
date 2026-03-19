const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VALID_DIAGNOSA = [
  "Scabies",
  "Kemungkinan_Scabies",
  "Perlu_Evaluasi_Lebih_Lanjut",
  "Bukan_Scabies"
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
  if (typeof value === "object") return [value];
  return [];
};

exports.getSantriList = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const whereCondition = {
      is_active: true,
      user_role: {
        some: { id_role: 1, is_active: true }
      }
    };

    if (search.trim()) {
      whereCondition.OR = [
        { nama: { contains: search } },
        { nip: { contains: search } }
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.users.findMany({
        where: whereCondition,
        skip,
        take: Number(limit),
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nama: true,
          nip: true,
          foto_profil: true,
          screening_screening_id_santriTousers: {
            take: 1,
            orderBy: { tanggal: "desc" },
            select: {
              tanggal: true,
              diagnosa: true
            }
          },
          _count: {
            select: {
              screening_screening_id_santriTousers: true
            }
          }
        }
      }),
      prisma.users.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getSantriDetail = async (req, res) => {
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
      return res.status(404).json({
        success: false,
        message: "Santri tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: {
        ...santri,
        kelas: santri.kelas_santri[0]?.kelas || null,
        kamar: santri.kamar_santri[0]?.kamar || null
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getScreeningBySantri = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      prisma.screening.count({
        where: { id_santri: Number(id) }
      }),
      prisma.screening.findMany({
        where: { id_santri: Number(id) },
        orderBy: { tanggal: "desc" },
        skip,
        take: Number(limit),
        include: {
          users_screening_id_timkesTousers: {
            select: { id: true, nama: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.postScreening = async (req, res) => {
  try {
    if (req.user.role !== "timkesehatan") {
      return res.status(403).json({ success: false, message: "Akses ditolak" });
    }

    const id_timkes = req.user.id;
    const id_santri = Number(req.body.id_santri);

    if (!id_santri) {
      return res.status(400).json({ success: false, message: "Santri tidak valid" });
    }

    const santriExists = await prisma.users.findFirst({
      where: {
        id: id_santri,
        is_active: true,
        user_role: { some: { id_role: 1, is_active: true } }
      }
    });

    if (!santriExists) {
      return res.status(404).json({ success: false, message: "Santri tidak ditemukan" });
    }

    const jawaban = safeParseArray(req.body.jawaban);
    const penanganan = safeParseArray(req.body.penanganan);
    const predileksi = safeParseArray(req.body.predileksi);
    let diagnosaManual = req.body.diagnosaManual;

    if (!Array.isArray(jawaban) || jawaban.length === 0) {
      return res.status(400).json({ success: false, message: "Jawaban tidak valid" });
    }

    if (diagnosaManual && !VALID_DIAGNOSA.includes(diagnosaManual)) {
      return res.status(400).json({ success: false, message: "Diagnosa tidak valid" });
    }

    const pertanyaanDB = await prisma.pertanyaan_screening.findMany({
      where: { is_active: true }
    });

    const pertanyaanMap = new Map(
      pertanyaanDB.map(p => [p.id_pertanyaan_screening, p])
    );

    let totalSkor = 0;

    for (const j of jawaban) {
      const pertanyaan = pertanyaanMap.get(j.id_pertanyaan_screening);
      if (!pertanyaan) continue;

      if (
        pertanyaan.bagian === "B" &&
        pertanyaan.tipe_jawaban === "BOOLEAN" &&
        j.jawaban === true
      ) {
        totalSkor += 1;
      }
    }

    let diagnosa = "Bukan_Scabies";
    if (totalSkor > 4) diagnosa = "Scabies";
    else if (totalSkor >= 2) diagnosa = "Perlu_Evaluasi_Lebih_Lanjut";

    const totalScreeningSebelumnya = await prisma.screening.count({
      where: { id_santri }
    });

    if (diagnosa === "Perlu_Evaluasi_Lebih_Lanjut" && totalScreeningSebelumnya === 0) {
      diagnosa = "Kemungkinan_Scabies";
    }

    if (diagnosaManual) diagnosa = diagnosaManual;

    const validBentuk = [
      "Ruam_Merah",
      "Bintil_Merah_Kecil",
      "Terowongan_Kecil_di_Kulit",
      "Bintil_Bernanah"
    ];

    const predileksiValid = Array.isArray(predileksi)
      ? predileksi.filter((item) => item && item.area && validBentuk.includes(item.bentuk_kelainan))
      : [];

    await prisma.$transaction(async (tx) => {
      const screening = await tx.screening.create({
        data: {
          id_timkes,
          id_santri,
          tanggal: new Date(),
          total_skor: totalSkor,
          status: "Selesai",
          diagnosa,
          catatan: null,
          is_active: true
        }
      });

      await tx.detail_screening.createMany({
        data: jawaban.map(j => ({
          id_screening: screening.id_screening,
          id_pertanyaan_screening: j.id_pertanyaan_screening,
          jawaban: j.jawaban ?? null,
          nilai_number: j.nilai_number ?? null,
          is_active: true
        }))
      });

      if (Array.isArray(penanganan) && penanganan.length > 0) {
        await tx.screening_penanganan.createMany({
          data: penanganan.map(id_penanganan => ({
            id_screening: screening.id_screening,
            id_penanganan: Number(id_penanganan)
          }))
        });
      }

      if (predileksiValid.length > 0) {
        await tx.screening_predileksi.createMany({
          data: predileksiValid.map((item) => ({
            id_screening: screening.id_screening,
            area: item.area,
            bentuk_kelainan: item.bentuk_kelainan,
            is_active: true
          }))
        });
      }
    });

    res.status(201).json({
      success: true,
      message: "Screening berhasil disimpan"
    });

  } catch (error) {
    console.error("POST SCREENING ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPertanyaan = async (req, res) => {
  try {
    const data = await prisma.pertanyaan_screening.findMany({
      where: { is_active: true },
      orderBy: { id_pertanyaan_screening: "asc" }
    });

    const bagianA = data.filter(p => p.bagian === "A");
    const bagianB = data.filter(p => p.bagian === "B");

    res.json({
      success: true,
      data: { bagianA, bagianB }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPenanganan = async (req, res) => {
  try {
    const data = await prisma.penanganan.findMany({
      where: { is_active: true },
      orderBy: { id_penanganan: "asc" }
    });

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDetailScreening = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await prisma.screening.findUnique({
      where: { id_screening: Number(id) },
      include: {
        users_screening_id_timkesTousers: {
          select: { id: true, nama: true }
        },
        users_screening_id_santriTousers: {
          select: {
            id: true,
            nama: true,
            nip: true,
            kelas_santri: {
              where: { is_active: true },
              include: {
                kelas: true
              }
            },
            kamar_santri: {
              where: { is_active: true },
              include: {
                kamar: true
              }
            }
          }
        },
        detail_screening: {
          include: {
            pertanyaan_screening: true
          }
        },
        screening_penanganan: {
          include: {
            penanganan: true
          }
        },
        screening_predileksi: {
          where: { is_active: true },
          orderBy: { id_predileksi: "asc" }
        }
      }
    });

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLatestScreening = async (req, res) => {
  try {
    const { id } = req.params;

    const latest = await prisma.screening.findFirst({
      where: { id_santri: Number(id) },
      orderBy: { tanggal: "desc" },
      include: {
        users_screening_id_timkesTousers: {
          select: { id: true, nama: true }
        }
      }
    });

    res.json({
      success: true,
      data: latest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};