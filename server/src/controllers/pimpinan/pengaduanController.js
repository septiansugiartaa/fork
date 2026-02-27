const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper Date
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// 1. GET: Daftar Pengaduan (Semua Pengaduan Aktif)
exports.getDaftarPengaduan = async (req, res) => {
  try {
    // req.user.id dihapus karena kita mau ambil semua data, bukan difilter per user

    const pengaduan = await prisma.pengaduan.findMany({
      where: { is_active: true }, // Hanya memfilter status aktif saja
      orderBy: [ {status: "asc"}, {waktu_aduan: "desc"} ],
      include: {
        // Data santri yang dilaporkan
        users_pengaduan_id_santriTousers: {
          select: {
            nama: true,
            nip: true,
            foto_profil: true,
            kelas_santri: { include: { kelas: true }, take: 1 },
          },
        },
        users_pengaduan_id_pelaporTousers: {
          select: {
            nama: true,
          }
        },
        _count: { select: { tanggapan_aduan: { where: { is_active: true } } } },
      },
    });

    const formattedData = pengaduan.map((item) => ({
      id: item.id,
      judul: item.judul || "Tanpa Judul",
      deskripsi: item.deskripsi,
      waktu: formatDate(item.waktu_aduan),
      status: item.status,
      santri: {
        nama: item.users_pengaduan_id_santriTousers?.nama || "Tidak diketahui",
        nip: item.users_pengaduan_id_santriTousers?.nip || "-",
        foto_profil: item.users_pengaduan_id_santriTousers?.foto_profil || null,
        kelas: item.users_pengaduan_id_santriTousers?.kelas_santri[0]?.kelas?.kelas || "-",
      },
      // Lempar nama pelapor ke frontend
      pelapor: item.users_pengaduan_id_pelaporTousers?.nama || "Tidak diketahui",
      jumlah_tanggapan: item._count.tanggapan_aduan,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error get pengaduan:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data pengaduan" });
  }
};

// 2. GET: Detail & Percakapan (Sama seperti referensimu)
exports.getDetailPengaduan = async (req, res) => {
  try {
    const { id } = req.params;
    const detail = await prisma.pengaduan.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_pengaduan_id_santriTousers: { select: { nama: true, nip: true } },
        tanggapan_aduan: {
          where: { is_active: true },
          orderBy: { waktu_tanggapan: "asc" },
          include: {
            users: {
              select: {
                id: true,
                nama: true,
                foto_profil: true,
                user_role: { include: { role: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!detail)
      return res
        .status(404)
        .json({ success: false, message: "Pengaduan tidak ditemukan" });

    // Formatting date
    detail.waktu_aduan_format = formatDate(detail.waktu_aduan);
    detail.tanggapan_aduan = detail.tanggapan_aduan.map((t) => ({
      ...t,
      waktu_format: formatDate(t.waktu_tanggapan),
    }));

    res.json({ success: true, data: detail });
  } catch (error) {
    console.error("Error get detail:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil detail pengaduan" });
  }
};
