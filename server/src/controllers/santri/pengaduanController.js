const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Daftar Pengaduan
exports.getDaftarPengaduan = async (req, res) => {
  const userId = req.user.id; 

  try {
    const pengaduan = await prisma.pengaduan.findMany({
      where: { 
        id_santri: userId, 
        is_active: true 
      },
      orderBy: { waktu_aduan: 'desc' },
      include: {
        users_pengaduan_id_pelaporTousers: {
          select: {
            id: true,
            nama: true,
            foto_profil: true,
            // Kita tetap butuh role pelapor untuk logic display di list
            user_role: {
              include: { role: true },
              take: 1
            }
          }
        },
        _count: { select: { tanggapan_aduan: { where: { is_active:true } } } }
      }
    });

    const formattedData = pengaduan.map(item => ({
      id: item.id,
      judul: item.judul,
      deskripsi: item.deskripsi,
      waktu: item.waktu_aduan,
      status: item.status,
      pelapor: {
        nama: item.users_pengaduan_id_pelaporTousers?.nama || "Seseorang",
        foto: item.users_pengaduan_id_pelaporTousers?.foto_profil
      },
      jumlah_tanggapan: item._count.tanggapan_aduan
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error get pengaduan:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data pengaduan" });
  }
};

// 2. GET: Detail & Percakapan
exports.getDetailPengaduan = async (req, res) => {
  const { id } = req.params;

  try {
    const detail = await prisma.pengaduan.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_pengaduan_id_pelaporTousers: {
          select: {
            nama: true,
            foto_profil: true,
            user_role: { include: { role: true }, take: 1 }
          }
        },
        tanggapan_aduan: {
          where: { is_active: true },
          orderBy: { waktu_tanggapan: 'asc' },
          include: {
            users: {
              select: {
                id: true,
                nama: true,
                foto_profil: true,
                user_role: { include: { role: true }, take: 1 },
                // UPDATE: Ambil data hubungan dari tabel orangtua
                // Relasi ini dibuat otomatis oleh Prisma berdasarkan schema Anda
                orangtua_orangtua_id_orangtuaTousers: {
                    select: { hubungan: true },
                    take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!detail) return res.status(404).json({ success: false, message: "Pengaduan tidak ditemukan" });

    res.json({ success: true, data: detail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengambil detail" });
  }
};

// 3. POST: Kirim Tanggapan
exports.kirimTanggapan = async (req, res) => {
  const { id_aduan, isi_tanggapan } = req.body;
  const id_user = req.user.id;

  try {
    const tanggapan = await prisma.tanggapan_aduan.create({
      data: {
        id_aduan: parseInt(id_aduan),
        id_user: id_user,
        tanggapan: isi_tanggapan,
        waktu_tanggapan: new Date(),
        is_active: true
      },
      include: {
        users: {
            select: {
                id: true,
                nama: true,
                user_role: { include: {role: true} },
                // Include ini agar saat return response, data hubungan langsung terbawa
                orangtua_orangtua_id_orangtuaTousers: {
                    select: { hubungan: true },
                    take: 1
                }
            }
        }
      }
    });

    res.json({ success: true, message: "Tanggapan terkirim", data: tanggapan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengirim tanggapan" });
  }
};