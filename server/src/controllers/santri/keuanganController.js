const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    const userId = req.user.id;

    // ... (Code ambil user sama) ...
    const santri = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        kelas_santri: {
          where: { is_active: true },
          take: 1,
          orderBy: { id: "desc" },
          include: { kelas: true },
        },
      },
    });

    if (!santri)
      return res
        .status(404)
        .json({ success: false, message: "Santri tidak ditemukan" });

    // 2. Ambil Semua Tagihan milik Santri
    const allTagihan = await prisma.tagihan.findMany({
      where: { id_santri: userId, is_active: true },
      include: { pembayaran: true }, // PENTING: Include history pembayaran
      orderBy: { tanggal_tagihan: "desc" },
    });

    // Helper mapper untuk format data seragam
    const mapTagihanData = (t) => ({
      id: t.id,
      nama_tagihan: t.nama_tagihan,
      nominal: formatRupiah(t.nominal),
      batas_pembayaran: formatDateIndo(t.batas_pembayaran),
      status: t.status, // 'Aktif' atau 'Lunas'
      // Map history pembayaran untuk modal
      riwayat_pembayaran: t.pembayaran.map((p) => ({
        id: p.id,
        tanggal: formatDateIndo(p.tanggal_bayar),
        jumlah: formatRupiah(p.jumlah_bayar),
        bukti: p.bukti_bayar, // File path jika ada
        status: p.status,
      })),
      // Untuk sorting di frontend jika perlu
      raw_date: t.batas_pembayaran,
    });

    // 3. Pisahkan Tagihan Aktif vs Lunas
    const tagihanAktif = allTagihan
      .filter((t) => t.status === "Aktif")
      .map(mapTagihanData);

    const riwayatLunas = allTagihan
      .filter((t) => t.status === "Lunas")
      .map((t) => {
        // Khusus lunas, kita butuh tanggal pelunasan di tabel depan
        const mapped = mapTagihanData(t);
        const lastPayDate =
          t.pembayaran.length > 0
            ? t.pembayaran[t.pembayaran.length - 1].tanggal_bayar
            : t.updatedAt;

        return {
          ...mapped,
          tanggal_lunas: formatDateIndo(lastPayDate), // Field khusus tabel riwayat
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
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat data keuangan" });
  }
};

// 2. Upload Bukti Pembayaran
exports.uploadPembayaran = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id_tagihan } = req.body; // Dikirim via FormData

    if (!req.file) {
      return res
        .status(400)
        .json({
          success: false,
          message: "File bukti pembayaran wajib diunggah.",
        });
    }

    // Cek Tagihan Valid
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: parseInt(id_tagihan) },
    });

    if (!tagihan || tagihan.id_santri !== userId) {
      // Hapus file jika tagihan tidak valid/bukan miliknya
      fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Tagihan tidak ditemukan." });
    }

    // Simpan ke Tabel Pembayaran
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
    res
      .status(500)
      .json({ success: false, message: "Gagal memproses pembayaran" });
  }
};

// Middleware Token (Gunakan ulang yang dari profileController juga bisa, atau buat utils terpisah)
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token missing" });

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid" });
  }
};
