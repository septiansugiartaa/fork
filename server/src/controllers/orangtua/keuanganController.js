const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs"); 

// Helper: Format Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// Helper: Format Tanggal Indonesia
const formatDateIndo = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

exports.getKeuanganDashboard = async (req, res) => {
  try {
    const parentId = req.user.id;

    const relasiOrangTua = await prisma.orangtua.findFirst({
      where: { id_orangtua: parentId, is_active: true },
      include: {
        users: { // Relasi ke data santri
          include: {
            kelas_santri: {
              where: { is_active: true },
              take: 1,
              orderBy: { id: "desc" },
              include: { kelas: true },
            },
          },
        },
      },
    });

    if (!relasiOrangTua || !relasiOrangTua.users) {
      return res.status(404).json({ success: false, message: "Data anak (santri) tidak ditemukan" });
    }

    const santri = relasiOrangTua.users;
    const santriId = santri.id; // Gunakan ID anak untuk pencarian tagihan

    // 2. Ambil Semua Tagihan milik Santri (Anak)
    const allTagihan = await prisma.tagihan.findMany({
      where: { id_santri: santriId, is_active: true },
      include: { pembayaran: true }, 
      orderBy: { tanggal_tagihan: "desc" },
    });

    // Helper mapper untuk format data seragam
    const mapTagihanData = (t) => ({
      id: t.id,
      nama_tagihan: t.nama_tagihan,
      nominal: formatRupiah(t.nominal),
      batas_pembayaran: formatDateIndo(t.batas_pembayaran),
      status: t.status, 
      riwayat_pembayaran: t.pembayaran.map((p) => ({
        id: p.id,
        tanggal: formatDateIndo(p.tanggal_bayar),
        jumlah: formatRupiah(p.nominal), // Di schema namanya nominal, bukan jumlah_bayar
        bukti: p.bukti_bayar,
        status: p.status,
      })),
      raw_date: t.batas_pembayaran,
    });

    // 3. Pisahkan Tagihan Aktif vs Lunas
    const tagihanAktif = allTagihan
      .filter((t) => t.status === "Aktif")
      .map(mapTagihanData);

    const riwayatLunas = allTagihan
      .filter((t) => t.status === "Lunas")
      .map((t) => {
        const mapped = mapTagihanData(t);
        const lastPayDate =
          t.pembayaran.length > 0
            ? t.pembayaran[t.pembayaran.length - 1].tanggal_bayar
            : t.updatedAt;

        return {
          ...mapped,
          tanggal_lunas: formatDateIndo(lastPayDate), 
        };
      });

    // 4. Format Data untuk Frontend
    const data = {
      info_santri: {
        nama: santri.nama,
        nis: santri.nip || "-",
        kelas: santri.kelas_santri[0]?.kelas?.kelas || "-",
        jumlah_tagihan_aktif: tagihanAktif.length,
      },
      tagihan_aktif: tagihanAktif,
      riwayat_lunas: riwayatLunas,
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error getKeuanganDashboard:", err);
    res.status(500).json({ success: false, message: "Gagal memuat data keuangan" });
  }
};

// 2. Upload Bukti Pembayaran (Versi Orang Tua)
exports.uploadPembayaran = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { id_tagihan } = req.body; 

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File bukti pembayaran wajib diunggah." });
    }

    // 1. Cari ID Santri dari Orang Tua
    const relasiOrangTua = await prisma.orangtua.findFirst({
        where: { id_orangtua: parentId, is_active: true }
    });

    if (!relasiOrangTua) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: "Relasi anak tidak ditemukan." });
    }

    const santriId = relasiOrangTua.id_santri;

    // 2. Cek Tagihan Valid (Milik si Anak)
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: parseInt(id_tagihan) },
    });

    if (!tagihan || tagihan.id_santri !== santriId) {
      // Hapus file jika tagihan tidak valid/bukan milik anaknya
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "Tagihan tidak ditemukan atau bukan milik anak Anda." });
    }

    // 3. Simpan ke Tabel Pembayaran
    await prisma.pembayaran.create({
      data: {
        id_tagihan: parseInt(id_tagihan),
        tanggal_bayar: new Date(),
        nominal: tagihan.nominal, // Asumsi bayar full sesuai nominal tagihan
        bukti_bayar: req.file.filename,
        metode_bayar: "Transfer",
        status: "Pending", // Default status
      },
    });

    res.json({
      success: true,
      message: "Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.",
    });
  } catch (err) {
    console.error("Error uploadPembayaran:", err);
    if (req.file) fs.unlinkSync(req.file.path); // Cleanup file jika terjadi error database
    res.status(500).json({ success: false, message: "Gagal memproses pembayaran" });
  }
};