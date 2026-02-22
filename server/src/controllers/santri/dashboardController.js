const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id; // ID User (Santri) dari token

        // 1. Ambil data User beserta relasi Kamar & Kelas
        const pengguna = await prisma.users.findUnique({
            where: { id: userId },
            include: {
                kelas_santri: {
                    where: { is_active: true },
                    take: 1,
                    orderBy: { id: 'desc' },
                    include: { kelas: true }
                },
                kamar_santri: {
                    where: { is_active: true },
                    take: 1,
                    orderBy: { tanggal_masuk: 'desc' },
                    include: { kamar: true }
                }
            }
        });

        if (!pengguna) {
            return res.status(404).json({ success: false, message: 'Data santri tidak ditemukan' });
        }

        const santriId = pengguna.id; 

        // 2. Jalankan Query Paralel
        const [
            tagihan, 
            kegiatanHariIni, 
            pengaduanList, // <--- PASTIKAN NAMA INI SAMA (bukan pengaduanTerakhir)
            observasiTerakhir, 
            screeningTerakhir,
            stats
        ] = await Promise.all([
            // A. Tagihan Terakhir
            prisma.tagihan.findFirst({
                where: { id_santri: santriId, is_active: true },
                orderBy: { tanggal_tagihan: 'desc' },
                include: {
                    pembayaran: { orderBy: { tanggal_bayar: 'desc' }, take: 1 }
                }
            }),

            // B. Kegiatan Hari Ini
            prisma.kegiatan.findMany({
                where: {
                    tanggal: new Date(),
                    is_active: true
                },
                orderBy: { waktu_mulai: 'asc' }
            }),

            // C. Pengaduan List (Ambil 3 Terakhir)
            prisma.pengaduan.findMany({
                where: { 
                    id_santri: santriId,
                    is_active: true 
                },
                orderBy: { waktu_aduan: 'desc' },
                take: 3 // Ambil 3 data
            }),

            // D. Observasi Terakhir
            prisma.observasi.findFirst({
                where: { id_santri: santriId, is_active: true },
                orderBy: { tanggal: 'desc' },
                include: { detail_observasi: { take: 1 } }
            }),

            // E. Screening Terakhir
            prisma.screening.findFirst({
                where: { id_santri: santriId },
                orderBy: { tanggal: 'desc' }
            }),

            // F. Statistik Count
            Promise.all([
                prisma.pengaduan.count({ where: { id_santri: santriId, is_active: true } }),
                prisma.observasi.count({ where: { id_santri: santriId, is_active: true } }),
                prisma.screening.count({ where: { id_santri: santriId } })
            ])
        ]);

        // Destructure hasil statistik
        const [jumlahPengaduan, jumlahObservasi, jumlahScreening] = stats;
        const pembayaranTerakhir = tagihan?.pembayaran?.[0] || null;

        // 3. Format Response
        const dashboardData = {
            santri: {
                nama: pengguna.nama || '-',
                nip: pengguna.nip || '-',
                foto_profil: pengguna.foto_profil || '-',
                kelas: pengguna.kelas_santri[0]?.kelas?.kelas || '-',
                kamar: pengguna.kamar_santri[0]?.kamar?.kamar || '-', 
                status: pengguna.is_active ? 'Aktif' : 'Tidak Aktif'
            },

            keuangan: {
                tagihan_terakhir: {
                    bulan: tagihan?.nama_tagihan || (tagihan?.tanggal_tagihan ? new Date(tagihan.tanggal_tagihan).toLocaleString('id-ID', { month: 'long' }) : '-'),
                    jumlah: tagihan?.nominal || 0,
                    status: tagihan?.status || (pembayaranTerakhir ? 'Diproses' : 'Belum Lunas'),
                    jatuh_tempo: tagihan?.batas_pembayaran || '-'
                },
                pembayaran_terakhir: pembayaranTerakhir ? {
                    tanggal: pembayaranTerakhir.tanggal_bayar,
                    nominal: pembayaranTerakhir.nominal,
                    metode: pembayaranTerakhir.metode_bayar,
                    status: pembayaranTerakhir.status
                } : null
            },

            kegiatan_hari_ini: kegiatanHariIni.map(keg => ({
                waktu_mulai: keg.waktu_mulai,
                waktu_selesai: keg.waktu_selesai,
                nama: keg.nama_kegiatan,
                penanggung_jawab: "Ustadz/Pengurus", 
                deskripsi: keg.deskripsi
            })),

            aktivitas_terakhir: {
                // Mapping Pengaduan List (Array)
                // KARENA NAMA VARIABEL DI ATAS SUDAH 'pengaduanList', INI JADI AMAN
                pengaduan: pengaduanList.map(p => ({
                    id: p.id,
                    deskripsi: p.judul || p.deskripsi || 'Pengaduan',
                    waktu: p.waktu_aduan,
                    status: p.status || 'Aktif',
                    jenis: 'pengaduan'
                })),
                
                observasi: observasiTerakhir ? {
                    id: observasiTerakhir.id_observasi,
                    tanggal: observasiTerakhir.tanggal,
                    catatan: observasiTerakhir.detail_observasi?.[0]?.catatan || '-',
                    status: 'Selesai',
                    jenis: 'observasi'
                } : null,

                screening: screeningTerakhir ? {
                    id: screeningTerakhir.id_screening,
                    tanggal: screeningTerakhir.tanggal,
                    total_skor: screeningTerakhir.total_skor || 0,
                    status: screeningTerakhir.status || '-',
                    diagnosa: screeningTerakhir.diagnosa || '-',
                    jenis: 'screening'
                } : null
            },

            statistik: {
                jumlah_pengaduan: jumlahPengaduan,
                jumlah_observasi: jumlahObservasi,
                jumlah_screening: jumlahScreening
            },

            menu_cepat: [
                { id: 1, nama: "Pendataan Diri", icon: "user", endpoint: "/santri/profil", accessible: true },
                { id: 2, nama: "Tagihan & Keuangan", icon: "credit-card", endpoint: "/santri/keuangan", accessible: true },
                { id: 3, nama: "Kegiatan", icon: "calendar", endpoint: "/santri/kegiatan", accessible: true },
                { id: 4, nama: "Pengaduan", icon: "alert-circle", endpoint: "/santri/pengaduan", accessible: true },
                { id: 5, nama: "Riwayat Layanan", icon: "history", endpoint: "/santri/layanan", accessible: true },
                { id: 6, nama: "Scabies", icon: "cross", endpoint: "/santri/scabies", accessible: true }
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