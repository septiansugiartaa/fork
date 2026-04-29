const prisma = require("../../config/prisma");

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HIGH_RISK_DIAGNOSES = ["Scabies", "Kemungkinan_Scabies", "Perlu_Evaluasi_Lebih_Lanjut"];

const startOfDay = (date = new Date()) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (year = new Date().getFullYear()) => new Date(year, 0, 1);
const endOfYear = (year = new Date().getFullYear()) => new Date(year + 1, 0, 1);

const getActiveSantriWhere = () => ({
  is_active: true,
  user_role: {
    some: {
      is_active: true,
      role: { role: "santri" },
    },
  },
});

const normalizeDiagnosis = (value) => (value || "-").replaceAll("_", " ");

const mapSantri = (user) => ({
  id: user?.id || null,
  nama: user?.nama || "-",
  nip: user?.nip || "-",
  kelas: user?.kelas_santri?.[0]?.kelas?.kelas || "-",
  kamar: user?.kamar_santri?.[0]?.kamar?.kamar || "-",
});

const uniqueLatestBySantri = (rows) => {
  const seen = new Set();
  const latestRows = [];

  rows.forEach((row) => {
    if (!row.id_santri || seen.has(row.id_santri)) return;
    seen.add(row.id_santri);
    latestRows.push(row);
  });

  return latestRows;
};

const buildMonthlyChart = ({ screenings, observations }) => {
  const chart = MONTH_LABELS.map((month) => ({
    month,
    screening: 0,
    observasi: 0,
    scabies: 0,
  }));

  screenings.forEach((item) => {
    if (!item.tanggal) return;
    const monthIndex = new Date(item.tanggal).getMonth();
    chart[monthIndex].screening += 1;
    if (item.diagnosa === "Scabies") chart[monthIndex].scabies += 1;
  });

  observations.forEach((item) => {
    if (!item.tanggal) return;
    const monthIndex = new Date(item.tanggal).getMonth();
    chart[monthIndex].observasi += 1;
  });

  return chart;
};

const buildYearlyChart = ({ screenings, observations, startYear, endYear }) => {
  const chart = Array.from({ length: endYear - startYear + 1 }, (_, index) => ({
    year: String(startYear + index),
    screening: 0,
    observasi: 0,
    kasusBerisiko: 0,
  }));
  const byYear = new Map(chart.map((item) => [Number(item.year), item]));

  screenings.forEach((item) => {
    if (!item.tanggal) return;
    const row = byYear.get(new Date(item.tanggal).getFullYear());
    if (!row) return;
    row.screening += 1;
    if (HIGH_RISK_DIAGNOSES.includes(item.diagnosa)) row.kasusBerisiko += 1;
  });

  observations.forEach((item) => {
    if (!item.tanggal) return;
    const row = byYear.get(new Date(item.tanggal).getFullYear());
    if (row) row.observasi += 1;
  });

  return chart;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const timkesId = Number(req.user.id);
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = addDays(now, -30);
    const currentYear = now.getFullYear();
    const yearlyStart = currentYear - 4;

    const activeSantriWhere = getActiveSantriWhere();
    const activeScreeningWhere = { is_active: true };
    const activeObservasiWhere = { is_active: true };

    const [
      timkes,
      totalSantri,
      screenedRecently,
      screeningToday,
      observasiToday,
      screeningThisMonth,
      observasiThisMonth,
      scabiesThisMonth,
      highRiskThisMonth,
      activeConsultations,
      waitingConsultations,
      unreadConsultations,
      pendingPengajuanMateri,
      monthlyScreenings,
      monthlyObservations,
      yearlyScreenings,
      yearlyObservations,
      latestScreeningRows,
      latestObservationRows,
      activeRooms,
    ] = await Promise.all([
      prisma.users.findUnique({ where: { id: timkesId }, select: { id: true, nama: true } }),
      prisma.users.count({ where: activeSantriWhere }),
      prisma.screening.findMany({
        where: { ...activeScreeningWhere, tanggal: { gte: thirtyDaysAgo } },
        distinct: ["id_santri"],
        select: { id_santri: true },
      }),
      prisma.screening.count({ where: { ...activeScreeningWhere, tanggal: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.observasi.count({ where: { ...activeObservasiWhere, tanggal: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.screening.count({ where: { ...activeScreeningWhere, tanggal: { gte: monthStart } } }),
      prisma.observasi.count({ where: { ...activeObservasiWhere, tanggal: { gte: monthStart } } }),
      prisma.screening.count({ where: { ...activeScreeningWhere, diagnosa: "Scabies", tanggal: { gte: monthStart } } }),
      prisma.screening.count({
        where: { ...activeScreeningWhere, diagnosa: { in: HIGH_RISK_DIAGNOSES }, tanggal: { gte: monthStart } },
      }),
      prisma.konsultasi_room.count({ where: { id_timkes: timkesId, status: "active" } }),
      prisma.konsultasi_room.count({ where: { id_timkes: timkesId, status: "waiting" } }),
      prisma.konsultasi_message.count({
        where: {
          is_active: true,
          read_at: null,
          id_sender: { not: timkesId },
          konsultasi_room: { id_timkes: timkesId, status: { in: ["active", "waiting"] } },
        },
      }),
      prisma.pengajuan_materi.count({ where: { status: "ditinjau" } }),
      prisma.screening.findMany({
        where: { ...activeScreeningWhere, tanggal: { gte: startOfYear(currentYear), lt: endOfYear(currentYear) } },
        select: { tanggal: true, diagnosa: true },
      }),
      prisma.observasi.findMany({
        where: { ...activeObservasiWhere, tanggal: { gte: startOfYear(currentYear), lt: endOfYear(currentYear) } },
        select: { tanggal: true },
      }),
      prisma.screening.findMany({
        where: { ...activeScreeningWhere, tanggal: { gte: startOfYear(yearlyStart), lt: endOfYear(currentYear) } },
        select: { tanggal: true, diagnosa: true },
      }),
      prisma.observasi.findMany({
        where: { ...activeObservasiWhere, tanggal: { gte: startOfYear(yearlyStart), lt: endOfYear(currentYear) } },
        select: { tanggal: true },
      }),
      prisma.screening.findMany({
        where: activeScreeningWhere,
        orderBy: [{ tanggal: "desc" }, { id_screening: "desc" }],
        include: {
          users_screening_id_santriTousers: {
            select: {
              id: true,
              nama: true,
              nip: true,
              kelas_santri: { where: { is_active: true }, take: 1, include: { kelas: true } },
              kamar_santri: { where: { is_active: true }, take: 1, include: { kamar: true } },
            },
          },
          users_screening_id_timkesTousers: { select: { nama: true } },
        },
      }),
      prisma.observasi.findMany({
        where: activeObservasiWhere,
        orderBy: [{ tanggal: "desc" }, { id_observasi: "desc" }],
        include: {
          users_observasi_id_santriTousers: {
            select: {
              id: true,
              nama: true,
              nip: true,
              kelas_santri: { where: { is_active: true }, take: 1, include: { kelas: true } },
              kamar_santri: { where: { is_active: true }, take: 1, include: { kamar: true } },
            },
          },
          users_observasi_id_timkesTousers: { select: { nama: true } },
        },
      }),
      prisma.konsultasi_room.findMany({
        where: { id_timkes: timkesId, status: { in: ["active", "waiting"] } },
        orderBy: [{ status: "asc" }, { updated_at: "desc" }],
        take: 5,
        include: {
          users_konsultasi_room_id_santriTousers: { select: { id: true, nama: true, nip: true } },
          konsultasi_message: {
            where: { is_active: true },
            orderBy: { sent_at: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const notScreened30Days = Math.max(totalSantri - screenedRecently.length, 0);
    const highRiskScreenings = uniqueLatestBySantri(latestScreeningRows)
      .filter((item) => HIGH_RISK_DIAGNOSES.includes(item.diagnosa))
      .slice(0, 6);
    const lowScoreObservations = uniqueLatestBySantri(latestObservationRows)
      .filter((item) => Number(item.skor_diperoleh || 0) <= 3)
      .slice(0, 6);

    return res.json({
      success: true,
      data: {
        generatedAt: now,
        timkes: {
          id: timkes?.id || timkesId,
          nama: timkes?.nama || "Tim Kesehatan",
        },
        kpi: {
          totalSantri,
          screeningToday,
          observasiToday,
          screeningThisMonth,
          observasiThisMonth,
          scabiesThisMonth,
          highRiskThisMonth,
          notScreened30Days,
          activeConsultations,
          waitingConsultations,
          unreadConsultations,
          pendingPengajuanMateri,
        },
        charts: {
          monthly: buildMonthlyChart({ screenings: monthlyScreenings, observations: monthlyObservations }),
          yearly: buildYearlyChart({
            screenings: yearlyScreenings,
            observations: yearlyObservations,
            startYear: yearlyStart,
            endYear: currentYear,
          }),
        },
        urgent: {
          highRiskScreenings: highRiskScreenings.map((item) => ({
            id: item.id_screening,
            tanggal: item.tanggal,
            total_skor: item.total_skor || 0,
            diagnosa: item.diagnosa,
            diagnosa_label: normalizeDiagnosis(item.diagnosa),
            santri: mapSantri(item.users_screening_id_santriTousers),
            pemeriksa: item.users_screening_id_timkesTousers?.nama || "-",
          })),
          lowScoreObservations: lowScoreObservations.map((item) => ({
            id: item.id_observasi,
            tanggal: item.tanggal,
            waktu: item.waktu || "-",
            skor_diperoleh: item.skor_diperoleh || 0,
            catatan: item.catatan || "-",
            santri: mapSantri(item.users_observasi_id_santriTousers),
            pemeriksa: item.users_observasi_id_timkesTousers?.nama || "-",
          })),
          activeRooms: activeRooms.map((room) => ({
            id: room.id_room,
            status: room.status,
            updated_at: room.updated_at,
            last_message_at: room.last_message_at,
            santri: {
              id: room.users_konsultasi_room_id_santriTousers?.id || null,
              nama: room.users_konsultasi_room_id_santriTousers?.nama || "-",
              nip: room.users_konsultasi_room_id_santriTousers?.nip || "-",
            },
            last_message: room.konsultasi_message?.[0]?.messgae_text || "Belum ada pesan.",
          })),
        },
      },
    });
  } catch (error) {
    console.error("Timkes dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memuat dashboard tim kesehatan.",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
