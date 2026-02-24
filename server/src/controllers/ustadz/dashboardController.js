const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id; // ID User dari token (Ustadz)

        // 1. Ambil data User (Ustadz)
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

        // 2. Jalankan Query Paralel untuk Performa Optimal
        const [
            kegiatanHariIni, 
            pengaduanTerbaru, 
            totalSantri, 
            pengaduanAktifCount,
            kegiatanAktifCount,
            kelasDiampu
        ] = await Promise.all([
            // A. Kegiatan Hari Ini 
            prisma.kegiatan.findMany({
                where: {
                    tanggal: {
                        gte: hariIniMulai,
                        lte: hariIniSelesai
                    },
                    is_active: true
                },
                orderBy: { waktu_mulai: 'asc' },
                take: 5
            }),

            // B. Pengaduan Terbaru
            prisma.pengaduan.findMany({
                where: { 
                    is_active: true,
                    status: 'Aktif' 
                },
                include: {
                    users_pengaduan_id_santriTousers: {
                        select: { nama: true }
                    }
                },
                orderBy: { waktu_aduan: 'desc' },
                take: 4
            }),

            // C. Count Total Santri Aktif di Pondok
            prisma.users.count({
                where: {
                    is_active: true,
                    user_role: { 
                        some: { role: { role: 'Santri' } } 
                    }
                }
            }),

            // D. Count Pengaduan Aktif
            prisma.pengaduan.count({
                where: {
                    is_active: true,
                    status: 'Aktif' 
                }
            }),

            // E. Count Kegiatan Aktif
            prisma.kegiatan.count({
                where: { is_active: true }
            }),

            // F. Cari kelas di mana ustadz ini menjadi wali
            prisma.kelas.findMany({
                where: {
                    id_wali: userId,
                    is_active: true
                },
                select: { kelas: true }
            })
        ]);

        let statusKelas = [];
        if (kelasDiampu.length > 0) {
            // Jika wali kelas, buat array misal: ["Wali Kelas 7A", "Wali Kelas 7B"]
            statusKelas = kelasDiampu.map(k => `Wali ${k.kelas}`);
        } else {
            // Jika bukan, default array 1 elemen
            statusKelas = ["Pengajar"];
        }

        // 3. Format Response
        const dashboardData = {
            ustadz: {
                nama: pengguna.nama || '-',
                nip: pengguna.nip || '-',
                foto_profil: pengguna.foto_profil || '-',
                jabatan: statusKelas
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