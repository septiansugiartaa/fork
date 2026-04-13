const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        const pengguna = await prisma.users.findUnique({
            where: { id: userId, is_active: true }
        });

        if (!pengguna) {
            return res.status(404).json({ success: false, message: 'Data ustadz tidak ditemukan' });
        }

        const hariIniMulai = new Date();
        hariIniMulai.setHours(0, 0, 0, 0);
        
        const hariIniSelesai = new Date();
        hariIniSelesai.setHours(23, 59, 59, 999);

        const [
            kegiatanHariIni, 
            pengaduanTerbaru, 
            totalSantri, 
            pengaduanAktifCount,
            kegiatanAktifCount,
            kelasDiampu,
            kamarDiampu
        ] = await Promise.all([
            prisma.kegiatan.findMany({
                where: {
                    tanggal: { gte: hariIniMulai, lte: hariIniSelesai },
                    is_active: true
                },
                orderBy: { waktu_mulai: 'asc' },
                take: 5
            }),
            prisma.pengaduan.findMany({
                where: { is_active: true, status: 'Aktif' },
                include: {
                    users_pengaduan_id_santriTousers: { select: { nama: true } }
                },
                orderBy: { waktu_aduan: 'desc' },
                take: 4
            }),
            prisma.users.count({
                where: {
                    is_active: true,
                    user_role: { some: { role: { role: 'Santri' } } }
                }
            }),
            prisma.pengaduan.count({
                where: { is_active: true, status: 'Aktif' }
            }),
            prisma.kegiatan.count({
                where: { is_active: true }
            }),
            prisma.kelas.findMany({
                where: { id_wali: userId, is_active: true },
                select: { id: true, kelas: true }
            }),
            prisma.kamar.findMany({
                where: { id_wali: userId, is_active: true },
                select: { id: true, kamar: true }
            })
        ]);

        // Bangun label jabatan: gabung kelas + kamar walian
        let jabatan = [];
        if (kelasDiampu.length > 0) {
            jabatan.push(...kelasDiampu.map(k => `Wali ${k.kelas}`));
        }
        if (kamarDiampu.length > 0) {
            jabatan.push(...kamarDiampu.map(k => `Wali ${k.kamar}`));
        }
        if (jabatan.length === 0) {
            jabatan = ['Pengajar'];
        }

        const dashboardData = {
            ustadz: {
                nama: pengguna.nama || '-',
                nip: pengguna.nip || '-',
                foto_profil: pengguna.foto_profil || '-',
                jabatan,
                kelas_binaan: kelasDiampu,
                kamar_binaan: kamarDiampu
            },

            kegiatan_hari_ini: kegiatanHariIni.map(keg => ({
                id: keg.id,
                waktu_mulai: keg.waktu_mulai,
                waktu_selesai: keg.waktu_selesai,
                nama: keg.nama_kegiatan,
                deskripsi: keg.deskripsi || 'Kegiatan Rutin'
            })),

            pengaduan_terbaru: pengaduanTerbaru.map(p => ({
                id: p.id,
                nama_santri: p.users_pengaduan_id_santriTousers?.nama || 'Santri Tidak Diketahui',
                deskripsi: p.deskripsi || p.judul || 'Laporan Pengaduan',
                waktu: p.waktu_aduan,
                status: p.status || 'Baru'
            })),

            statistik: {
                jumlah_santri: totalSantri,
                pengaduan_aktif: pengaduanAktifCount,
                kegiatan_aktif: kegiatanAktifCount
            },

            menu_cepat: [
                { id: 1, nama: "Daftar Santri", icon: "users", endpoint: "/ustadz/daftar-santri", accessible: true },
                { id: 2, nama: "Jadwal & Kegiatan", icon: "calendar", endpoint: "/ustadz/kegiatan", accessible: true },
                { id: 3, nama: "Pengaduan", icon: "message-square", endpoint: "/ustadz/pengaduan", accessible: true }
            ]
        };

        res.status(200).json({
            success: true,
            data: dashboardData,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error fetching Ustadz dashboard data:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan sistem saat memuat dashboard Ustadz',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
};
