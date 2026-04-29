const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const DIAGNOSA_LABELS = {
  Scabies: "Scabies",
  Bukan_Scabies: "Bukan Scabies",
  Kemungkinan_Scabies: "Kemungkinan Scabies",
  Perlu_Evaluasi_Lebih_Lanjut: "Perlu Evaluasi Lebih Lanjut"
};

const uniqueLatestScreeningBySantri = (rows) => {
  const seen = new Set();
  const latest = [];

  rows.forEach((row) => {
    if (!row.id_santri || seen.has(row.id_santri)) return;
    seen.add(row.id_santri);
    latest.push(row);
  });

  return latest;
};

const buildScabiesCharts = (latestRows) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearlyStart = currentYear - 4;

  const monthly = MONTH_LABELS.map((month) => ({
    month,
    terkena_scabies: 0,
    tidak_terpapar: 0,
    perlu_evaluasi: 0,
    total: 0
  }));

  const yearly = Array.from({ length: 5 }, (_, index) => ({
    year: String(yearlyStart + index),
    terkena_scabies: 0,
    tidak_terpapar: 0,
    perlu_evaluasi: 0,
    total: 0
  }));

  const yearlyMap = new Map(yearly.map((item) => [Number(item.year), item]));

  latestRows.forEach((item) => {
    if (!item.tanggal) return;

    const date = new Date(item.tanggal);
    const isScabies = item.diagnosa === "Scabies";
    const isNotExposed = item.diagnosa === "Bukan_Scabies";
    const isEvaluation =
      item.diagnosa === "Kemungkinan_Scabies" ||
      item.diagnosa === "Perlu_Evaluasi_Lebih_Lanjut";

    if (date.getFullYear() === currentYear) {
      const row = monthly[date.getMonth()];
      row.total += 1;
      if (isScabies) row.terkena_scabies += 1;
      if (isNotExposed) row.tidak_terpapar += 1;
      if (isEvaluation) row.perlu_evaluasi += 1;
    }

    const yearlyRow = yearlyMap.get(date.getFullYear());
    if (yearlyRow) {
      yearlyRow.total += 1;
      if (isScabies) yearlyRow.terkena_scabies += 1;
      if (isNotExposed) yearlyRow.tidak_terpapar += 1;
      if (isEvaluation) yearlyRow.perlu_evaluasi += 1;
    }
  });

  return { monthly, yearly };
};

const mapLatestScreeningRow = (item) => ({
  id_santri: item.id_santri,
  nama: item.users_screening_id_santriTousers?.nama || "-",
  tanggal: item.tanggal,
  kamar: item.users_screening_id_santriTousers?.kamar_santri?.[0]?.kamar?.kamar || "-",
  kelas: item.users_screening_id_santriTousers?.kelas_santri?.[0]?.kelas?.kelas || "-",
  diagnosa: item.diagnosa,
  diagnosa_label: DIAGNOSA_LABELS[item.diagnosa] || item.diagnosa?.replace(/_/g, " ") || "-",
});

const groupMonthlyDetail = (rows) => ({
  scabies: rows.filter((item) => item.diagnosa === "Scabies").map(mapLatestScreeningRow),
  evaluasi: rows
    .filter((item) => item.diagnosa === "Kemungkinan_Scabies" || item.diagnosa === "Perlu_Evaluasi_Lebih_Lanjut")
    .map(mapLatestScreeningRow),
  bukan_scabies: rows.filter((item) => item.diagnosa === "Bukan_Scabies").map(mapLatestScreeningRow),
});

exports.getDashboardData = async (req, res) => {
  try {
    // A. KESEHATAN (Screening terakhir per santri)
    const screeningRows = await prisma.screening.findMany({
      where: { is_active: true },
      orderBy: [{ tanggal: "desc" }, { id_screening: "desc" }],
      select: {
        id_santri: true,
        tanggal: true,
        diagnosa: true,
        users_screening_id_santriTousers: {
          select: {
            nama: true,
            kelas_santri: {
              where: { is_active: true },
              take: 1,
              include: { kelas: true }
            },
            kamar_santri: {
              where: { is_active: true },
              take: 1,
              include: { kamar: true }
            }
          }
        }
      }
    });

    const latestScreenings = uniqueLatestScreeningBySantri(screeningRows);
    const currentYear = new Date().getFullYear();
    const latestScreeningsThisYear = latestScreenings.filter((item) => {
      if (!item.tanggal) return false;
      return new Date(item.tanggal).getFullYear() === currentYear;
    });
    const diagnosaCounts = latestScreenings.reduce((acc, item) => {
      acc[item.diagnosa] = (acc[item.diagnosa] || 0) + 1;
      return acc;
    }, {});
    const kesehatanData = Object.entries(diagnosaCounts).map(([diagnosa, value]) => ({
      name: DIAGNOSA_LABELS[diagnosa] || diagnosa.replace(/_/g, " "),
      value
    }));
    const scabiesCharts = buildScabiesCharts(latestScreenings);

    // B. KEUANGAN & PENDAPATAN
    const totalPendapatan = await prisma.pembayaran.aggregate({
      _sum: { nominal: true },
      where: { status: 'Berhasil' }
    });

    const tagihanRaw = await prisma.tagihan.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    let lunas = 0, aktif = 0;
    tagihanRaw.forEach(t => {
      if (t.status === 'Lunas') lunas = t._count.status;
      if (t.status === 'Aktif') aktif = t._count.status; 
    });
    
    const totalTagihan = lunas + aktif;
    const persentaseTunggakan = totalTagihan === 0 ? 0 : Math.round((aktif / totalTagihan) * 100);

    const today = new Date();
    const last6Months = [];
    const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      last6Months.push({
        bulan: namaBulan[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        pendapatan: 0
      });
    }

    const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const riwayatPembayaran = await prisma.pembayaran.findMany({
      where: {
        status: 'Berhasil',
        tanggal_bayar: { gte: startDate }
      },
      select: {
        nominal: true,
        tanggal_bayar: true
      }
    });

    riwayatPembayaran.forEach(bayar => {
      const bBulan = bayar.tanggal_bayar.getMonth();
      const bTahun = bayar.tanggal_bayar.getFullYear();

      const index = last6Months.findIndex(m => m.month === bBulan && m.year === bTahun);
      if (index !== -1) {
        last6Months[index].pendapatan += bayar.nominal;
      }
    });

    const pendapatanBulanan = last6Months.map(m => ({
      bulan: m.bulan,
      pendapatan: m.pendapatan
    }));

    // C. KEDISIPLINAN & PENGADUAN
    const aduanRaw = await prisma.pengaduan.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    let aduanAktif = 0, aduanSelesai = 0;
    aduanRaw.forEach(a => {
      if (a.status === 'Aktif') aduanAktif = a._count.status;
      if (a.status === 'Selesai') aduanSelesai = a._count.status;
    });

    // D. KEPUASAN LAYANAN (Feedback)
    const kepuasanRaw = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        kesehatan: kesehatanData,
        scabies_dashboard: {
          summary: {
            total_screening_terakhir: latestScreenings.length,
            terkena_scabies: diagnosaCounts.Scabies || 0,
            tidak_terpapar: diagnosaCounts.Bukan_Scabies || 0,
            perlu_evaluasi:
              (diagnosaCounts.Kemungkinan_Scabies || 0) +
              (diagnosaCounts.Perlu_Evaluasi_Lebih_Lanjut || 0)
          },
          chart_bulanan: scabiesCharts.monthly,
          chart_tahunan: scabiesCharts.yearly,
          detail_bulanan: groupMonthlyDetail(latestScreeningsThisYear),
          detail_tahunan: scabiesCharts.yearly
        },
        keuangan: {
          total_pendapatan: totalPendapatan._sum.nominal || 0,
          persentase_tunggakan: persentaseTunggakan,
          grafik_bulanan: pendapatanBulanan
        },
        kedisiplinan: {
          total_aduan: aduanAktif + aduanSelesai,
          aktif: aduanAktif,
          selesai: aduanSelesai
        },
        kepuasan: {
          rata_rata: (kepuasanRaw._avg.rating || 0).toFixed(1),
          total_ulasan: kepuasanRaw._count.id || 0
        }
      }
    });

  } catch (error) {
    console.error("Error get Pimpinan Dashboard:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data dashboard" });
  }
};
