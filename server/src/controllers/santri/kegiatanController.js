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
    
    // Karena tipe data Time di Prisma mereturn Date object (1970-01-01Ttime), kita ambil jam menitnya
    const formatTime = (dateObj) => {
        return new Date(dateObj).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
        });
    };

    return `${formatTime(start)} - ${formatTime(end)} WIB`;
};

exports.getKegiatan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, type } = req.query; // Filter (Optional)

        // Query Filter
        let whereCondition = { is_active: true };
        
        if (search) {
            whereCondition.nama_kegiatan = { contains: search };
        }
        
        // Filter Waktu (Mendatang vs Selesai) - Contoh logic sederhana
        const today = new Date();
        if (type === 'Mendatang') {
            whereCondition.tanggal = { gte: today };
        } else if (type === 'Selesai') {
            whereCondition.tanggal = { lt: today };
        }

        const kegiatans = await prisma.kegiatan.findMany({
            where: whereCondition,
            orderBy: { tanggal: 'desc' }, // Terbaru dulu
            include: {
                // Cek Absensi User Ini (Untuk tombol Feedback)
                absensi: {
                    where: { id_user: userId },
                    select: { id: true, status: true } // Ambil ID & Status
                },
                // Cek Feedback User Ini (Biar gak double feedback)
                feedback: {
                    where: { id_user: userId },
                    select: { id: true }
                }
            }
        });

        // Mapping Data untuk Frontend
        const data = kegiatans.map(k => {
            const hasAttended = k.absensi.length > 0; // Apakah user ada di list absensi?
            const hasFeedback = k.feedback.length > 0; // Apakah user sudah kasih feedback?

            return {
                id: k.id,
                nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal),
                waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi,
                deskripsi: k.deskripsi || "Tidak ada deskripsi.",
                // Logic Tombol Feedback
                can_feedback: hasAttended && !hasFeedback, 
                feedback_status: hasFeedback ? "Sudah Memberi Feedback" : (hasAttended ? "Belum" : "Tidak Hadir")
            };
        });

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getKegiatan:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan' });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_kegiatan, rating, isi_text } = req.body;

        if (!id_kegiatan || !rating || !isi_text) {
            return res.status(400).json({ success: false, message: 'Data feedback tidak lengkap' });
        }

        // Cek Validasi (User benar-benar hadir?)
        const absensi = await prisma.absensi.findFirst({
            where: { id_user: userId, id_kegiatan: parseInt(id_kegiatan) }
        });

        if (!absensi) {
            return res.status(403).json({ success: false, message: 'Anda tidak terdaftar hadir di kegiatan ini.' });
        }

        // Simpan Feedback
        await prisma.feedback.create({
            data: {
                id_user: userId,
                id_kegiatan: parseInt(id_kegiatan),
                rating: parseInt(rating),
                isi_text: isi_text,
                tanggal: new Date(),
                is_active: true
            }
        });

        res.json({ success: true, message: 'Terima kasih atas masukan Anda!' });

    } catch (err) {
        console.error("Error submitFeedback:", err);
        res.status(500).json({ success: false, message: 'Gagal mengirim feedback' });
    }
};

// Middleware Auth (Re-use)
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Token missing' });
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token invalid' });
    }
};