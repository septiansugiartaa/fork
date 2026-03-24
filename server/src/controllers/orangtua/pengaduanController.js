const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDaftarPengaduan = async (req, res) => {
  const parentId = req.user.id; 
  const { id_santri } = req.query;

  try {
    let santriId;
    if (id_santri) {
        const cek = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, id_santri: parseInt(id_santri), is_active: true } });
        if (!cek) return res.status(403).json({ success: false, message: "Akses ditolak" });
        santriId = cek.id_santri;
    } else {
        const relasi = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, is_active: true } });
        if (!relasi) return res.json({ success: true, data: [] });
        santriId = relasi.id_santri;
    }

    const pengaduan = await prisma.pengaduan.findMany({
      where: { id_santri: santriId, is_active: true },
      orderBy: { waktu_aduan: 'desc' },
      include: {
        users_pengaduan_id_pelaporTousers: { select: { id: true, nama: true, foto_profil: true, user_role: { include: { role: true }, take: 1 } } },
        _count: { select: { tanggapan_aduan: { where: { is_active:true } } } }
      }
    });

    const formattedData = pengaduan.map(item => ({
      id: item.id, judul: item.judul, deskripsi: item.deskripsi, waktu: item.waktu_aduan, status: item.status,
      pelapor: { nama: item.users_pengaduan_id_pelaporTousers?.nama || "Seseorang", foto: item.users_pengaduan_id_pelaporTousers?.foto_profil },
      jumlah_tanggapan: item._count.tanggapan_aduan
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error get pengaduan:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data pengaduan" });
  }
};

exports.getSantriOptions = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { id_santri } = req.query;

        let relasiAnak;
        if (id_santri) {
            relasiAnak = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, id_santri: parseInt(id_santri), is_active: true }, include: { users_orangtua_id_santriTousers: true } });
        } else {
            relasiAnak = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, is_active: true }, include: { users_orangtua_id_santriTousers: true } });
        }

        if (!relasiAnak || !relasiAnak.users_orangtua_id_santriTousers) {
            return res.json({ success: true, data: [] });
        }

        const santri = relasiAnak.users_orangtua_id_santriTousers;
        res.json({ success: true, data: [{ id: santri.id, nama: santri.nama, nip: santri.nip }] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat opsi santri" });
    }
};

exports.buatPengaduan = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { id_santri, judul, deskripsi } = req.body;

        if (!judul || !deskripsi || !id_santri) {
            return res.status(400).json({ success: false, message: "Data laporan belum lengkap" });
        }

        const cekRelasi = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, id_santri: parseInt(id_santri), is_active: true } });
        if (!cekRelasi) return res.status(400).json({ success: false, message: "Data anak tidak ditemukan atau tidak valid." });

        await prisma.pengaduan.create({
            data: {
                id_pelapor: parentId, id_santri: parseInt(id_santri), judul: judul, deskripsi: deskripsi,
                waktu_aduan: new Date(), status: 'Aktif', is_active: true
            }
        });

        res.status(201).json({ success: true, message: "Laporan pengaduan berhasil dikirim!" });
    } catch (error) {
        console.error("Error buat pengaduan:", error);
        res.status(500).json({ success: false, message: "Gagal membuat pengaduan" });
    }
};

exports.getDetailPengaduan = async (req, res) => {
  const { id } = req.params;
  const parentId = req.user.id;

  try {
    const detail = await prisma.pengaduan.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_pengaduan_id_pelaporTousers: { select: { nama: true, foto_profil: true, user_role: { include: { role: true }, take: 1 } } },
        tanggapan_aduan: {
          where: { is_active: true }, orderBy: { waktu_tanggapan: 'asc' },
          include: { users: { select: { id: true, nama: true, foto_profil: true, user_role: { include: { role: true }, take: 1 }, orangtua_orangtua_id_orangtuaTousers: { select: { hubungan: true }, take: 1 } } } }
        }
      }
    });

    if (!detail) return res.status(404).json({ success: false, message: "Pengaduan tidak ditemukan" });
    
    // Cek Akses
    const cekAkses = await prisma.orangtua.findFirst({ where: { id_orangtua: parentId, id_santri: detail.id_santri, is_active: true } });
    if(!cekAkses) return res.status(403).json({ success: false, message: "Akses ditolak" });

    res.json({ success: true, data: detail });
  } catch (error) { res.status(500).json({ success: false, message: "Gagal mengambil detail" }); }
};

exports.kirimTanggapan = async (req, res) => {
  const { id_aduan, isi_tanggapan } = req.body;
  const id_user = req.user.id;

  try {
    const pengaduan = await prisma.pengaduan.findUnique({ where: { id: parseInt(id_aduan) } });
    if (!pengaduan) return res.status(404).json({ success: false, message: "Pengaduan tidak ditemukan" });
    
    const cekAkses = await prisma.orangtua.findFirst({ where: { id_orangtua: id_user, id_santri: pengaduan.id_santri, is_active: true } });
    if(!cekAkses) return res.status(403).json({ success: false, message: "Akses ditolak" });

    if (pengaduan.status === 'Selesai') {
        return res.status(400).json({ success: false, message: "Pengaduan telah selesai, diskusi ditutup." });
    }

    const tanggapan = await prisma.tanggapan_aduan.create({
      data: { id_aduan: parseInt(id_aduan), id_user: id_user, tanggapan: isi_tanggapan, waktu_tanggapan: new Date(), is_active: true },
      include: { users: { select: { id: true, nama: true, user_role: { include: {role: true} }, orangtua_orangtua_id_orangtuaTousers: { select: { hubungan: true }, take: 1 } } } }
    });

    res.json({ success: true, message: "Tanggapan terkirim", data: tanggapan });
  } catch (error) { res.status(500).json({ success: false, message: "Gagal mengirim tanggapan" }); }
};