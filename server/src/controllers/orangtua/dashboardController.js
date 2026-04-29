const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const DIAGNOSA_LABELS = {
    Scabies: "Scabies",
    Bukan_Scabies: "Bukan Scabies",
    Kemungkinan_Scabies: "Kemungkinan Scabies",
    Perlu_Evaluasi_Lebih_Lanjut: "Perlu Evaluasi Lebih Lanjut"
};

const NORMALIZED_DIAGNOSA = {
    Scabies: "scabies",
    Bukan_Scabies: "bukan_scabies",
    Kemungkinan_Scabies: "evaluasi",
    Perlu_Evaluasi_Lebih_Lanjut: "evaluasi"
};

const getObservasiCategory = (score) => {
    if (score >= 6) return "Baik";
    if (score >= 4) return "Cukup";
    return "Kurang";
};

const createEmptyParentDashboard = ({ parentName = "-", fotoProfil = null }) => ({
    list_anak: [],
    ortu: {
        nama: parentName,
        hubungan: "Wali",
        foto_profil: fotoProfil
    },
    anak: {
        id: null,
        nama: "Belum Terhubung",
        nip: "-",
        foto_profil: null,
        kelas: "-",
        kamar: "-",
        hubungan: "Wali"
    },
    keuangan: {
        tagihan_pending: null,
        total_terbayar: 0
    },
    kesehatan: {
        observasi: null,
        screening: null
    },
    scabies_dashboard: buildScabiesDashboard([], []),
    kegiatan_hari_ini: [],
    pengaduan_terakhir: [],
    statistik: {
        tagihan_aktif: 0,
        kehadiran_total: 0
    },
    meta: {
        has_linked_santri: false,
        info: "Akun orang tua belum terhubung dengan data santri."
    }
});

const buildScabiesDashboard = (screenings, observasiList) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = currentYear - 4;

    const monthly = MONTH_LABELS.map((month) => ({
        month,
        scabies: 0,
        bukan_scabies: 0,
        evaluasi: 0,
        total: 0
    }));

    const yearly = Array.from({ length: 5 }, (_, index) => ({
        year: String(startYear + index),
        scabies: 0,
        bukan_scabies: 0,
        evaluasi: 0,
        total: 0
    }));

    const yearlyMap = new Map(yearly.map((item) => [Number(item.year), item]));

    screenings.forEach((item) => {
        if (!item?.tanggal) return;

        const date = new Date(item.tanggal);
        if (Number.isNaN(date.getTime())) return;

        const normalized = NORMALIZED_DIAGNOSA[item.diagnosa];
        if (date.getFullYear() === currentYear) {
            const monthlyRow = monthly[date.getMonth()];
            monthlyRow.total += 1;
            if (normalized) monthlyRow[normalized] += 1;
        }

        const yearlyRow = yearlyMap.get(date.getFullYear());
        if (yearlyRow) {
            yearlyRow.total += 1;
            if (normalized) yearlyRow[normalized] += 1;
        }
    });

    const latestScreening = screenings[0] || null;
    const latestObservasi = observasiList[0] || null;
    const latestObservasiScore = latestObservasi
        ? latestObservasi.total_skor ?? latestObservasi.detail_observasi?.reduce((sum, item) => sum + (item.jawaban ? 1 : 0), 0) ?? 0
        : null;

    const latestThreeScreenings = screenings.slice(0, 3).map((item) => ({
        id_screening: item.id_screening,
        tanggal: item.tanggal,
        diagnosa: item.diagnosa,
        diagnosa_label: DIAGNOSA_LABELS[item.diagnosa] || item.diagnosa?.replace(/_/g, " ") || "-"
    }));

    const totalScreenings = screenings.length;
    const countByDiagnosis = screenings.reduce((acc, item) => {
        const normalized = NORMALIZED_DIAGNOSA[item.diagnosa];
        if (normalized) acc[normalized] = (acc[normalized] || 0) + 1;
        return acc;
    }, { scabies: 0, bukan_scabies: 0, evaluasi: 0 });

    const last12MonthsWithData = monthly.filter((item) => item.total > 0);
    const mostFrequentMonthlyStatus = last12MonthsWithData.length
        ? [...last12MonthsWithData].sort((a, b) => b.total - a.total)[0]
        : null;

    return {
        summary: {
            total_screening: totalScreenings,
            total_observasi: observasiList.length,
            screening_terakhir: latestScreening ? {
                tanggal: latestScreening.tanggal,
                diagnosa: latestScreening.diagnosa,
                diagnosa_label: DIAGNOSA_LABELS[latestScreening.diagnosa] || latestScreening.diagnosa?.replace(/_/g, " ") || "-"
            } : null,
            observasi_terakhir: latestObservasi ? {
                tanggal: latestObservasi.tanggal,
                skor: latestObservasiScore,
                kategori: getObservasiCategory(latestObservasiScore)
            } : null,
            total_scabies: countByDiagnosis.scabies || 0,
            total_evaluasi: countByDiagnosis.evaluasi || 0,
            total_bukan_scabies: countByDiagnosis.bukan_scabies || 0
        },
        chart_bulanan: monthly,
        chart_tahunan: yearly,
        latest_history: latestThreeScreenings,
        insights: {
            intensitas_monitoring: mostFrequentMonthlyStatus
                ? `Monitoring paling aktif tercatat pada ${mostFrequentMonthlyStatus.month} dengan ${mostFrequentMonthlyStatus.total} riwayat screening.`
                : "Belum ada pola monitoring bulanan yang bisa dibaca dari riwayat screening.",
            status_terakhir: latestScreening
                ? `Status screening terakhir anak saat ini adalah ${DIAGNOSA_LABELS[latestScreening.diagnosa] || latestScreening.diagnosa}.`
                : "Anak belum memiliki riwayat screening scabies.",
            observasi_terakhir: latestObservasi
                ? `Skor observasi terakhir berada pada kategori ${getObservasiCategory(latestObservasiScore)} dengan nilai ${latestObservasiScore}.`
                : "Belum ada data observasi cuci tangan untuk anak ini."
        }
    };
};

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
            return res.status(200).json({
                success: true,
                data: createEmptyParentDashboard({
                    parentName: req.user.nama || dataDiri?.nama || "-",
                    fotoProfil: dataDiri?.foto_profil || null
                })
            });
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
            observasiTerakhir, screeningTerakhir, stats,
            screeningHistory, observasiHistory
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
            ]),
            prisma.screening.findMany({
                where: { id_santri: santriId },
                orderBy: [{ tanggal: 'desc' }, { id_screening: 'desc' }],
                select: {
                    id_screening: true,
                    tanggal: true,
                    diagnosa: true
                }
            }),
            prisma.observasi.findMany({
                where: { id_santri: santriId, is_active: true },
                orderBy: [{ tanggal: 'desc' }, { id_observasi: 'desc' }],
                include: {
                    detail_observasi: {
                        where: { is_active: true },
                        select: { jawaban: true }
                    }
                }
            })
        ]);

        const scabiesDashboard = buildScabiesDashboard(screeningHistory, observasiHistory);

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
                scabies_dashboard: scabiesDashboard,
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
