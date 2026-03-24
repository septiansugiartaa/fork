const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
};

// 1. GET SUMMARY LIST (Agregat Kegiatan & Jenis Layanan)
exports.getFeedbackSummary = async (req, res) => {
  try {
    let combinedData = [];

    // KUMPULKAN FEEDBACK KEGIATAN (Hanya hitung yg aktif untuk rata-rata global)
    const kegiatan = await prisma.kegiatan.findMany({
      where: { feedback: { some: { is_active: true } } },
      include: { feedback: { where: { is_active: true } } }
    });

    kegiatan.forEach(k => {
      const totalRating = k.feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
      const avgRating = k.feedback.length > 0 ? (totalRating / k.feedback.length).toFixed(1) : 0;
      
      combinedData.push({
        id: k.id,
        tipe: 'Kegiatan',
        judul: k.nama_kegiatan,
        tanggal: formatDate(k.tanggal), 
        tanggal_raw: k.tanggal,
        avg_rating: parseFloat(avgRating),
        total_ulasan: k.feedback.length
      });
    });

    // KUMPULKAN FEEDBACK BERDASARKAN "JENIS LAYANAN"
    const jenisLayanan = await prisma.jenis_layanan.findMany({
      where: {
        riwayat_layanan: { some: { feedback: { some: { is_active: true } } } }
      },
      include: {
        riwayat_layanan: { include: { feedback: { where: { is_active: true } } } }
      }
    });

    jenisLayanan.forEach(jl => {
      let allFeedbacks = [];
      jl.riwayat_layanan.forEach(rl => { allFeedbacks = allFeedbacks.concat(rl.feedback); });

      if (allFeedbacks.length > 0) {
        const totalRating = allFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
        const avgRating = (totalRating / allFeedbacks.length).toFixed(1);
        const latestFeedbackDate = new Date(Math.max(...allFeedbacks.map(f => new Date(f.tanggal || 0))));

        combinedData.push({
          id: jl.id,
          tipe: 'Layanan',
          judul: `Layanan: ${jl.nama_layanan}`,
          tanggal: formatDate(latestFeedbackDate),
          tanggal_raw: latestFeedbackDate,
          avg_rating: parseFloat(avgRating),
          total_ulasan: allFeedbacks.length
        });
      }
    });

    combinedData.sort((a, b) => new Date(b.tanggal_raw) - new Date(a.tanggal_raw));
    res.json({ success: true, data: combinedData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat data feedback" });
  }
};

// 2. GET DETAIL FEEDBACK
exports.getFeedbackDetail = async (req, res) => {
  try {
    const { type, id } = req.params;
    const targetId = parseInt(id);

    let detail = null;
    let feedbacks = [];

    // PENTING: Jangan filter 'where is_active: true' di sini agar data yang dihapus (Tombstone) tetap masuk ke Frontend
    if (type === 'Kegiatan') {
      const k = await prisma.kegiatan.findUnique({
        where: { id: targetId },
        include: { 
            feedback: { 
                orderBy: { tanggal: 'desc' },
                include: { users: { select: { nama: true, foto_profil: true } } }
            } 
        }
      });
      if (k) {
        detail = { judul: k.nama_kegiatan, tanggal: formatDate(k.tanggal), tipe: 'Kegiatan' };
        feedbacks = k.feedback;
      }
    } else if (type === 'Layanan') {
      const jl = await prisma.jenis_layanan.findUnique({ where: { id: targetId } });
      if (jl) {
        const rawFeedbacks = await prisma.feedback.findMany({
          where: { riwayat_layanan: { id_layanan: targetId } },
          orderBy: { tanggal: 'desc' },
          include: { users: { select: { nama: true, foto_profil: true } } }
        });
        detail = { judul: `Layanan: ${jl.nama_layanan}`, tanggal: "Akumulasi Seluruh Waktu", tipe: 'Layanan' };
        feedbacks = rawFeedbacks;
      }
    }

    if (!detail) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });

    // Hitung rata-rata HANYA dari feedback yang MASIH AKTIF (is_active: true)
    const activeFeedbacks = feedbacks.filter(f => f.is_active);
    const totalRating = activeFeedbacks.reduce((sum, f) => sum + (f.rating || 0), 0);
    detail.avg_rating = activeFeedbacks.length > 0 ? (totalRating / activeFeedbacks.length).toFixed(1) : 0;
    detail.total_ulasan = activeFeedbacks.length;

    const formattedFeedbacks = feedbacks.map(f => ({
        id: f.id,
        nama_user: f.users?.nama || "Anonim",
        foto_user: f.users?.foto_profil || null,
        rating: f.rating,
        komentar: f.isi_text,
        tanggal: formatDate(f.tanggal),
        is_active: f.is_active // <-- PENTING untuk Frontend
    }));

    res.json({ success: true, detail, feedbacks: formattedFeedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat detail feedback" });
  }
};

// 3. FUNGSI KHUSUS ADMIN: Sembunyikan (Moderasi) Feedback
exports.hideFeedback = async (req, res) => {
    try {
        const { idFeedback } = req.params;
        await prisma.feedback.update({
            where: { id: parseInt(idFeedback) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Komentar berhasil dimoderasi (disembunyikan)" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memoderasi komentar" });
    }
};