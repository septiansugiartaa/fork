const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id; // ID dari token

        // 1. Ambil data User beserta relasi Kamar & Kelas
        // Di skema: users berelasi langsung ke kamar_santri dan kelas_santri
        const pengguna = await prisma.users.findUnique({
            where: { 
                id: userId // Sesuai skema: id, bukan id_pengguna
            },
            include: {
                // Ambil kelas yang aktif
                kelas_santri: {
                    where: { is_active: true },
                    take: 1,
                    orderBy: { id: 'desc' }, // Ambil data insert terakhir
                    include: {
                        kelas: true
                    }
                },
                // Ambil kamar yang aktif
                kamar_santri: {
                    where: { is_active: true }, // Boolean? di skema
                    take: 1,
                    orderBy: { tanggal_masuk: 'desc' },
                    include: {
                        kamar: true
                    }
                }
            }
        });

        if (!pengguna) {
            return res.status(404).json({ 
                success: false, 
                message: 'Data santri tidak ditemukan' 
            });
        }

        // Karena users adalah santri itu sendiri
        const santriId = pengguna.id; 

        // Jalankan query paralel biar cepat (Promise.all)
        // Kita hapus 'pengumuman' karena tabel tidak ada di skema
        const [
            tagihan, 
            kegiatanHariIni, 
            pengaduanTerakhir, 
            observasiTerakhir, 
            screeningTerakhir,
            stats
        ] = await Promise.all([
            // A. Tagihan Terakhir
            prisma.tagihan.findFirst({
                where: { 
                    id_santri: santriId,
                    is_active: true
                },
                orderBy: { tanggal_tagihan: 'desc' },
                include: {
                    // Include pembayaran untuk cek status detail
                    pembayaran: {
                        orderBy: { tanggal_bayar: 'desc' },
                        take: 1
                    }
                }
            }),

            // B. Kegiatan Hari Ini
            prisma.kegiatan.findMany({
                where: {
                    tanggal: new Date(), // Prisma otomatis handle date conversion
                    is_active: true
                },
                orderBy: { waktu_mulai: 'asc' }
            }),

            // C. Pengaduan Terakhir
            prisma.pengaduan.findFirst({
                where: { 
                    id_santri: santriId, // Relasi: pengaduan_id_santriTousers
                    is_active: true 
                },
                orderBy: { waktu_aduan: 'desc' }
            }),

            // D. Observasi Terakhir
            prisma.observasi.findFirst({
                where: { 
                    id_santri: santriId, // Relasi: observasi_id_santriTousers
                    is_active: true 
                },
                orderBy: { tanggal: 'desc' },
                include: {
                    detail_observasi: { // Ambil detail untuk catatan/skor
                        take: 1
                    }
                }
            }),

            // E. Screening Terakhir
            prisma.screening.findFirst({
                where: { id_santri: santriId },
                orderBy: { tanggal: 'desc' }
            }),

            // F. Statistik (Hitung jumlah)
            Promise.all([
                prisma.pengaduan.count({ where: { id_santri: santriId, is_active: true } }),
                prisma.observasi.count({ where: { id_santri: santriId, is_active: true } }),
                prisma.screening.count({ where: { id_santri: santriId } })
            ])
        ]);

        // Destructure hasil statistik
        const [jumlahPengaduan, jumlahObservasi, jumlahScreening] = stats;

        // Proses pembayaran terakhir dari tagihan (jika ada tagihan)
        const pembayaranTerakhir = tagihan?.pembayaran?.[0] || null;

        // FORMAT RESPONSE
        const dashboardData = {
            santri: {
                nama: pengguna.nama || '-',
                nip: pengguna.nip || '-',
                // Akses array kelas_santri -> objek kelas -> nama kelas
                kelas: pengguna.kelas_santri[0]?.kelas?.kelas || '-',
                // Akses array kamar_santri -> objek kamar -> nama kamar (field 'kamar')
                kamar: pengguna.kamar_santri[0]?.kamar?.kamar || '-', 
                status: pengguna.is_active ? 'Aktif' : 'Tidak Aktif'
            },

            keuangan: {
                tagihan_terakhir: {
                    // Gunakan nama_tagihan atau bulan dari tanggal
                    bulan: tagihan?.nama_tagihan || (tagihan?.tanggal_tagihan ? new Date(tagihan.tanggal_tagihan).toLocaleString('id-ID', { month: 'long' }) : '-'),
                    jumlah: tagihan?.nominal || 0,
                    // Status logika: Jika lunas di tabel tagihan ATAU ada pembayaran berhasil
                    status: tagihan?.status || (pembayaranTerakhir ? 'Diproses' : 'Belum Lunas'),
                    jatuh_tempo: tagihan?.batas_pembayaran || '-' // Sesuai skema: batas_pembayaran
                },
                pembayaran_terakhir: pembayaranTerakhir ? {
                    tanggal: pembayaranTerakhir.tanggal_bayar,
                    nominal: pembayaranTerakhir.nominal,
                    metode: pembayaranTerakhir.metode_bayar,
                    status: pembayaranTerakhir.status
                } : null
            },

            kegiatan_hari_ini: kegiatanHariIni.map(keg => ({
                waktu_mulai: keg.waktu_mulai, // Format Time di DB biasanya string/Date object
                waktu_selesai: keg.waktu_selesai,
                nama: keg.nama_kegiatan,
                // Penanggung jawab hanya ID di tabel kegiatan, kecuali di-include relation
                penanggung_jawab: "Ustadz/Pengurus", 
                deskripsi: keg.deskripsi
            })),

            // KOSONGKAN karena tabel 'pengumuman' TIDAK ADA di skema
            pengumuman: [], 

            aktivitas_terakhir: {
                pengaduan: pengaduanTerakhir ? {
                    id: pengaduanTerakhir.id,
                    deskripsi: pengaduanTerakhir.deskripsi || pengaduanTerakhir.judul || '-',
                    waktu: pengaduanTerakhir.waktu_aduan,
                    status: pengaduanTerakhir.status || 'Aktif'
                } : null,

                observasi: observasiTerakhir ? {
                    id: observasiTerakhir.id_observasi,
                    tanggal: observasiTerakhir.tanggal,
                    // Tabel observasi minim field, ambil catatan dari detail jika ada
                    catatan: observasiTerakhir.detail_observasi[0]?.catatan || '-',
                    // status_sebelum/sesudah TIDAK ADA di tabel observasi skema ini
                    status: 'Selesai' 
                } : null,

                screening: screeningTerakhir ? {
                    id: screeningTerakhir.id_screening,
                    tanggal: screeningTerakhir.tanggal,
                    total_skor: screeningTerakhir.total_skor || 0,
                    status: screeningTerakhir.status || '-',
                    diagnosa: screeningTerakhir.diagnosa || '-' // Enum
                } : null
            },

            statistik: {
                jumlah_pengaduan: jumlahPengaduan,
                jumlah_observasi: jumlahObservasi,
                jumlah_screening: jumlahScreening
            },

            // Menu Cepat (Static)
            menu_cepat: [
                { id: 1, nama: "Pendataan Diri", icon: "user", endpoint: "/santri/profil", accessible: true },
                { id: 2, nama: "Tagihan & Keuangan", icon: "credit-card", endpoint: "/santri/keuangan", accessible: true },
                { id: 3, nama: "Kegiatan", icon: "calendar", endpoint: "/santri/kegiatan", accessible: true },
                { id: 4, nama: "Pengaduan", icon: "alert-circle", endpoint: "/santri/pengaduan", accessible: true },
                { id: 5, nama: "Riwayat Layanan", icon: "history", endpoint: "/santri/riwayat", accessible: true }
            ]
        };

        res.status(200).json({
            success: true,
            data: dashboardData,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan sistem',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
};

// Middleware untuk verifikasi token (sama seperti sebelumnya)
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Token tidak ditemukan' 
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false,
            message: 'Token tidak valid',
            error: err.message 
        });
    }
};