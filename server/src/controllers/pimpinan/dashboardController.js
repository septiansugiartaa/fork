const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
  try {
    // A. KESEHATAN (Screening Scabies)
    const kesehatanRaw = await prisma.screening.groupBy({
      by: ['diagnosa'],
      _count: { diagnosa: true },
    });

    let kesehatanData = kesehatanRaw.map(item => ({
      name: item.diagnosa.replace(/_/g, ' '), 
      value: item._count.diagnosa
    }));

    // --- TAMBAHKAN BLOK INI SEMENTARA UNTUK TESTING UI ---
    if (kesehatanData.length === 0) {
      kesehatanData = [
        { name: 'Scabies', value: 15 },
        { name: 'Bukan Scabies', value: 65 },
        { name: 'Kemungkinan Scabies', value: 10 },
        { name: 'Perlu Evaluasi Lebih Lanjut', value: 5 }
      ];
    }

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