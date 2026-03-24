const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: Format Tanggal Indonesia (Senin, 14 Agustus 2024)
const formatFullDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
};

// Helper: Format Waktu (09:00 - 17:00 WIB)
const formatTimeRange = (start, end) => {
    if (!start || !end) return "-";
    const formatTime = (dateObj) => {
        return new Date(dateObj).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
        });
    };
    return `${formatTime(start)} - ${formatTime(end)} WIB`;
};

exports.getKegiatanAnak = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { search, type } = req.query;

        // 1. Cari ID Santri yang terhubung dengan Orang Tua
        const relasiAnak = await prisma.orangtua.findFirst({
            where: { id_orangtua: parentId, is_active: true }
        });

        if (!relasiAnak) {
            return res.json({ success: true, data: [] });
        }

        const santriId = relasiAnak.id_santri;

        // 2. Query Kegiatan yang DIIKUTI (ADA DI TABEL ABSENSI) oleh Anak
        let whereCondition = {
            is_active: true,
            absensi: {
                some: { id_user: santriId } // WAJIB ADA di tabel absensi untuk anak ini
            }
        };
        
        if (search) {
            whereCondition.nama_kegiatan = { contains: search };
        }
        
        const today = new Date();
        if (type === 'Mendatang') {
            whereCondition.tanggal = { gte: today };
        } else if (type === 'Selesai') {
            whereCondition.tanggal = { lt: today };
        }

        const kegiatans = await prisma.kegiatan.findMany({
            where: whereCondition,
            orderBy: { tanggal: 'desc' },
            include: {
                // Tarik detail absensi si anak untuk kegiatan ini
                absensi: {
                    where: { id_user: santriId },
                    select: { status: true }
                },
                // Tarik feedback dari si anak (bila ada)
                feedback: {
                    where: { id_user: santriId },
                    select: { rating: true, isi_text: true, tanggal: true }
                }
            }
        });

        // 3. Mapping Data untuk Frontend
        const data = kegiatans.map(k => {
            const statusAbsen = k.absensi[0]?.status || "Tidak Hadir";
            const feedbackAnak = k.feedback[0] || null;

            return {
                id: k.id,
                nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal),
                waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi,
                deskripsi: k.deskripsi || "Tidak ada deskripsi.",
                status_kehadiran: statusAbsen,
                // Kirim feedback anak untuk ditampilkan di modal ortu
                feedback_data: feedbackAnak ? {
                    rating: feedbackAnak.rating,
                    isi_text: feedbackAnak.isi_text,
                    tanggal: formatFullDate(feedbackAnak.tanggal)
                } : null
            };
        });

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getKegiatanAnak:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan anak' });
    }
};