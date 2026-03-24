const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_santri } = req.query; // Tangkap param dari React

        const dataDiri = await prisma.users.findFirst({
            where: { id: userId, is_active: true },
        });

        // 1. Cari Semua Relasi Anak Milik Orangtua
        const relasiSemuaAnak = await prisma.orangtua.findMany({
            where: { id_orangtua: userId, is_active: true },
            include: {
                users_orangtua_id_santriTousers: {
                    include: {
                        kelas_santri: { where: { is_active: true }, take: 1, include: { kelas: true } },
                        kamar_santri: { where: { is_active: true }, take: 1, include: { kamar: true } }
                    }
                }
            }
        });

        if (relasiSemuaAnak.length === 0) {
            return res.status(404).json({ success: false, message: 'Data anak tidak ditemukan' });
        }

        // Tentukan anak mana yang mau ditampilkan
        let relasiAktif = id_santri 
            ? relasiSemuaAnak.find(r => r.id_santri === parseInt(id_santri)) 
            : relasiSemuaAnak[0];
            
        if (!relasiAktif) relasiAktif = relasiSemuaAnak[0];

        const anak = relasiAktif.users_orangtua_id_santriTousers;
        const santriId = anak.id;

        // List anak untuk dropdown
        const list_anak = relasiSemuaAnak.map(r => ({
            id_santri: r.id_santri,
            nama: r.users_orangtua_id_santriTousers.nama,
            kelas: r.users_orangtua_id_santriTousers.kelas_santri[0]?.kelas?.kelas || '-'
        }));

        // 2. Jalankan Query Paralel (Berdasarkan santriId yang aktif)
        const [
            tagihan, kegiatanHariIni, pengaduanTerakhir,
            observasiTerakhir, screeningTerakhir, stats
        ] = await Promise.all([
            prisma.tagihan.findFirst({
                where: { id_santri: santriId, status: 'Aktif', is_active: true },
                orderBy: { tanggal_tagihan: 'desc' }
            }),
            prisma.kegiatan.findMany({
                where: { tanggal: new Date(), is_active: true },
                orderBy: { waktu_mulai: 'asc' }
            }),
            prisma.pengaduan.findMany({
                where: { id_santri: santriId, is_active: true },
                orderBy: { waktu_aduan: 'desc' },
                take: 3
            }),
            prisma.observasi.findFirst({
                where: { id_santri: santriId, is_active: true },
                orderBy: { tanggal: 'desc' },
                include: { detail_observasi: true }
            }),
            prisma.screening.findFirst({
                where: { id_santri: santriId },
                orderBy: { tanggal: 'desc' }
            }),
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
                list_anak: list_anak,
                ortu: { 
                    nama: req.user.nama, 
                    hubungan: relasiAktif.hubungan, 
                    foto_profil: dataDiri.foto_profil 
                },
                anak: {
                    id: anak.id,
                    nama: anak.nama,
                    nip: anak.nip,
                    foto_profil: anak.foto_profil,
                    kelas: anak.kelas_santri[0]?.kelas?.kelas || '-',
                    kamar: anak.kamar_santri[0]?.kamar?.kamar || '-',
                    hubungan: relasiAktif.hubungan
                },
                keuangan: {
                    tagihan_pending: tagihan ? {
                        nama: tagihan.nama_tagihan, nominal: tagihan.nominal, jatuh_tempo: tagihan.batas_pembayaran
                    } : null,
                    total_terbayar: stats[2]._sum.nominal || 0
                },
                kesehatan: {
                    observasi: observasiTerakhir ? {
                        tanggal: observasiTerakhir.tanggal, catatan: observasiTerakhir.detail_observasi[0]?.catatan || 'Kondisi Baik'
                    } : null,
                    screening: screeningTerakhir ? {
                        tanggal: screeningTerakhir.tanggal, status: screeningTerakhir.status, diagnosa: screeningTerakhir.diagnosa
                    } : null
                },
                kegiatan_hari_ini: kegiatanHariIni,
                pengaduan_terakhir: pengaduanTerakhir,
                statistik: {
                    tagihan_aktif: stats[0], kehadiran_total: stats[1]
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memuat dashboard orang tua' });
    }
};