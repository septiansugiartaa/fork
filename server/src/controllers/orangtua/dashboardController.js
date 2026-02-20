const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        const dataDiri = await prisma.users.findFirst({
            where: { id: userId, is_active: true },
        })
        const relasiAnak = await prisma.orangtua.findFirst({
            where: { id_orangtua: userId, is_active: true },
            include: {
                users: {
                    include: {
                        kelas_santri: {
                            where: { is_active: true },
                            take: 1,
                            include: { kelas: true }
                        },
                        kamar_santri: {
                            where: { is_active: true },
                            take: 1,
                            include: { kamar: true }
                        }
                    }
                }
            }
        });

        if (!relasiAnak || !relasiAnak.users) {
            return res.status(404).json({ success: false, message: 'Data anak tidak ditemukan' });
        }

        const anak = relasiAnak.users;
        const santriId = anak.id;

        // 2. Jalankan Query Paralel untuk data si anak
        const [
            tagihan,
            kegiatanHariIni,
            pengaduanTerakhir,
            observasiTerakhir,
            screeningTerakhir,
            stats
        ] = await Promise.all([
            // A. Tagihan Aktif Anak
            prisma.tagihan.findFirst({
                where: { id_santri: santriId, status: 'Aktif', is_active: true },
                orderBy: { tanggal_tagihan: 'desc' }
            }),

            // B. Kegiatan Pondok Hari Ini
            prisma.kegiatan.findMany({
                where: {
                    tanggal: new Date(),
                    is_active: true
                },
                orderBy: { waktu_mulai: 'asc' }
            }),

            // C. Pengaduan terkait Anak (yang dilaporkan ortu atau tentang anak)
            prisma.pengaduan.findMany({
                where: { id_santri: santriId, is_active: true },
                orderBy: { waktu_aduan: 'desc' },
                take: 3
            }),

            // D. Kesehatan Anak (Observasi)
            prisma.observasi.findFirst({
                where: { id_santri: santriId, is_active: true },
                orderBy: { tanggal: 'desc' },
                include: { detail_observasi: true }
            }),

            // E. Screening Scabies Anak
            prisma.screening.findFirst({
                where: { id_santri: santriId },
                orderBy: { tanggal: 'desc' }
            }),

            // F. Statistik Dashboard Ortu
            Promise.all([
                prisma.tagihan.count({ where: { id_santri: santriId, status: 'Aktif' } }),
                prisma.absensi.count({ where: { id_user: santriId, status: 'Hadir' } }),
                prisma.pembayaran.aggregate({
                    where: { tagihan: { id_santri: santriId }, status: 'Berhasil' },
                    _sum: { nominal: true }
                })
            ])
        ]);

        // 3. Format Response
        res.status(200).json({
            success: true,
            data: {
                ortu: { 
                    nama: req.user.nama, 
                    hubungan:relasiAnak.hubungan, 
                    foto_profil: dataDiri.foto_profil 
                },
                anak: {
                    id: anak.id,
                    nama: anak.nama,
                    nip: anak.nip,
                    foto_profil: anak.foto_profil,
                    kelas: anak.kelas_santri[0]?.kelas?.kelas || '-',
                    kamar: anak.kamar_santri[0]?.kamar?.kamar || '-',
                    hubungan: relasiAnak.hubungan
                },
                keuangan: {
                    tagihan_pending: tagihan ? {
                        nama: tagihan.nama_tagihan,
                        nominal: tagihan.nominal,
                        jatuh_tempo: tagihan.batas_pembayaran
                    } : null,
                    total_terbayar: stats[2]._sum.nominal || 0
                },
                kesehatan: {
                    observasi: observasiTerakhir ? {
                        tanggal: observasiTerakhir.tanggal,
                        catatan: observasiTerakhir.detail_observasi[0]?.catatan || 'Kondisi Baik'
                    } : null,
                    screening: screeningTerakhir ? {
                        tanggal: screeningTerakhir.tanggal,
                        status: screeningTerakhir.status,
                        diagnosa: screeningTerakhir.diagnosa
                    } : null
                },
                kegiatan_hari_ini: kegiatanHariIni,
                pengaduan_terakhir: pengaduanTerakhir,
                statistik: {
                    tagihan_aktif: stats[0],
                    kehadiran_total: stats[1]
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memuat dashboard orang tua' });
    }
};