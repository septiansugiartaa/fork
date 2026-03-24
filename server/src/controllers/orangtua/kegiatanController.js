const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatFullDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeRange = (start, end) => {
    if (!start || !end) return "-";
    const formatTime = (dateObj) => new Date(dateObj).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    return `${formatTime(start)} - ${formatTime(end)} WIB`;
};

exports.getKegiatanAnak = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { search, type, id_santri } = req.query;

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

        let whereCondition = {
            is_active: true,
            absensi: { some: { id_user: santriId } }
        };
        
        if (search) whereCondition.nama_kegiatan = { contains: search };
        
        const today = new Date();
        if (type === 'Mendatang') whereCondition.tanggal = { gte: today };
        else if (type === 'Selesai') whereCondition.tanggal = { lt: today };

        const kegiatans = await prisma.kegiatan.findMany({
            where: whereCondition,
            orderBy: { tanggal: 'desc' },
            include: {
                absensi: { where: { id_user: santriId }, select: { status: true } },
                feedback: { where: { id_user: santriId }, select: { rating: true, isi_text: true, tanggal: true } }
            }
        });

        const data = kegiatans.map(k => {
            const statusAbsen = k.absensi[0]?.status || "Tidak Hadir";
            const feedbackAnak = k.feedback[0] || null;

            return {
                id: k.id, nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal), waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi, deskripsi: k.deskripsi || "Tidak ada deskripsi.", status_kehadiran: statusAbsen,
                feedback_data: feedbackAnak ? {
                    rating: feedbackAnak.rating, isi_text: feedbackAnak.isi_text, tanggal: formatFullDate(feedbackAnak.tanggal)
                } : null
            };
        });

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getKegiatanAnak:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan anak' });
    }
};