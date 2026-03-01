const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper Date
const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

// 1. GET: Daftar Pengaduan (Yang dibuat oleh Ustadz ini)
exports.getDaftarPengaduan = async (req, res) => {
    try {
        const ustadzId = req.user.id; 
        const pengaduan = await prisma.pengaduan.findMany({
            where: { id_pelapor: ustadzId, is_active: true },
            orderBy: { waktu_aduan: 'desc' },
            include: {
                users_pengaduan_id_santriTousers: { select: { nama: true, nip: true, kelas_santri: { include: { kelas: true }, take: 1 } } },
                _count: { select: { tanggapan_aduan: { where: { is_active: true } } } }
            }
        });

        const formattedData = pengaduan.map(item => ({
            id: item.id,
            judul: item.judul || "Tanpa Judul",
            deskripsi: item.deskripsi,
            waktu: formatDate(item.waktu_aduan),
            status: item.status,
            santri: {
                nama: item.users_pengaduan_id_santriTousers?.nama || "Tidak diketahui",
                nip: item.users_pengaduan_id_santriTousers?.nip || "-",
                kelas: item.users_pengaduan_id_santriTousers?.kelas_santri[0]?.kelas?.kelas || "-"
            },
            jumlah_tanggapan: item._count.tanggapan_aduan
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error get pengaduan:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data pengaduan" });
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
                    orderBy: { waktu_tanggapan: 'asc' },
                    include: {
                        users: {
                            select: {
                                id: true,
                                nama: true,
                                foto_profil: true,
                                user_role: { include: { role: true }, take: 1 }
                            }
                        }
                    }
                }
            }
        });

        if (!detail) return res.status(404).json({ success: false, message: "Pengaduan tidak ditemukan" });

        // Formatting date
        detail.waktu_aduan_format = formatDate(detail.waktu_aduan);
        detail.tanggapan_aduan = detail.tanggapan_aduan.map(t => ({
            ...t,
            waktu_format: formatDate(t.waktu_tanggapan)
        }));

        res.json({ success: true, data: detail });
    } catch (error) {
        console.error("Error get detail:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil detail pengaduan" });
    }
};

// 3. POST: Buat Pengaduan Baru
exports.buatPengaduan = async (req, res) => {
    try {
        const ustadzId = req.user.id;
        const { id_santri, judul, deskripsi } = req.body;

        if (!id_santri || !judul || !deskripsi) {
            return res.status(400).json({ success: false, message: "Data tidak lengkap" });
        }

        await prisma.pengaduan.create({
            data: {
                id_pelapor: ustadzId,
                id_santri: parseInt(id_santri),
                judul: judul,
                deskripsi: deskripsi,
                waktu_aduan: new Date(),
                status: 'Aktif',
                is_active: true
            }
        });

        res.status(201).json({ success: true, message: "Pengaduan berhasil dibuat!" });
    } catch (error) {
        console.error("Error buat pengaduan:", error);
        res.status(500).json({ success: false, message: "Gagal membuat pengaduan" });
    }
};

// 4. POST: Kirim Tanggapan
exports.kirimTanggapan = async (req, res) => {
    try {
        const id_user = req.user.id;
        const { id_aduan, isi_tanggapan } = req.body;

        const cekStatus = await prisma.pengaduan.findUnique({ where: { id: parseInt(id_aduan) } });
        if (cekStatus?.status === 'Selesai') {
            return res.status(400).json({ success: false, message: "Pengaduan telah selesai, diskusi ditutup." });
        }

        const tanggapan = await prisma.tanggapan_aduan.create({
            data: {
                id_aduan: parseInt(id_aduan),
                id_user: id_user,
                tanggapan: isi_tanggapan,
                waktu_tanggapan: new Date(),
                is_active: true
            },
            include: { users: { select: { nama: true, user_role: { include: {role: true} } } } }
        });

        res.json({ success: true, message: "Tanggapan terkirim", data: tanggapan });
    } catch (error) {
        console.error("Error kirim tanggapan:", error);
        res.status(500).json({ success: false, message: "Gagal mengirim tanggapan" });
    }
};

// 5. GET: List Options Santri untuk Modal Create
exports.getSantriOptions = async (req, res) => {
    try {
        const ustadzId = req.user.id;

        const kelasBinaan = await prisma.kelas.findMany({
            where: { id_wali: ustadzId, is_active: true },
            select: { id: true }
        });

        const idKelasBinaan = kelasBinaan.map(k => k.id);

        if (idKelasBinaan.length === 0) {
            return res.json({ 
                success: true, 
                data: [], 
                message: "Anda bukan wali kelas, tidak ada santri binaan." 
            });
        }

        const santris = await prisma.users.findMany({
            where: { 
                is_active: true, 
                user_role: { some: { role: { role: 'Santri' } } },
                kelas_santri: {
                    some: {
                        id_kelas: { in: idKelasBinaan },
                        is_active: true
                    }
                }
            },
            select: { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' }
        });

        res.json({ success: true, data: santris });
    } catch (error) {
        console.error("Error get santri options:", error);
        res.status(500).json({ success: false, message: "Gagal memuat opsi santri" });
    }
};

// 6. PUT: Selesaikan Pengaduan
exports.selesaikanPengaduan = async (req, res) => {
    try {
        const ustadzId = req.user.id;
        const { id } = req.params;

        const pengaduanExist = await prisma.pengaduan.findFirst({
            where: { 
                id: parseInt(id),
                id_pelapor: ustadzId
            }
        });

        if (!pengaduanExist) {
            return res.status(404).json({ success: false, message: "Pengaduan tidak ditemukan atau Anda tidak berhak menutupnya." });
        }

        if (pengaduanExist.status === 'Selesai') {
            return res.status(400).json({ success: false, message: "Pengaduan ini sudah berstatus Selesai." });
        }

        await prisma.pengaduan.update({
            where: { id: parseInt(id) },
            data: { status: 'Selesai' }
        });

        res.json({ success: true, message: "Pengaduan berhasil diselesaikan." });

    } catch (error) {
        console.error("Error menyelesaikan pengaduan:", error);
        res.status(500).json({ success: false, message: "Gagal menyelesaikan pengaduan." });
    }
};