const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Daftar Riwayat Layanan
exports.getRiwayatLayanan = async (req, res) => {
    const userId = req.user.id;

    try {
        const riwayat = await prisma.riwayat_layanan.findMany({
            where: { 
                id_santri: userId,
                is_active: true
            },
            orderBy: { waktu: 'desc' },
            include: {
                jenis_layanan: {
                    select: { nama_layanan: true }
                },
                // Cek apakah sudah ada feedback untuk riwayat ini
                feedback: {
                    where: { id_user: userId },
                    select: { id: true }
                }
            }
        });

        // Format data
        const formattedData = riwayat.map(item => ({
            id: item.id,
            nama_layanan: item.jenis_layanan?.nama_layanan || 'Layanan Dihapus',
            tanggal: item.waktu,
            status: item.status_sesudah || item.status_sebelum || 'Proses', // Prioritas status sesudah
            catatan: item.catatan,
            sudah_feedback: item.feedback.length > 0
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat riwayat" });
    }
};

// 2. GET: Detail Riwayat (Header + Jawaban Form)
exports.getDetailRiwayat = async (req, res) => {
    const { id } = req.params;

    try {
        const detail = await prisma.riwayat_layanan.findUnique({
            where: { id: parseInt(id) },
            include: {
                jenis_layanan: true,
                riwayat_layanan_detail: true // Ambil isi form (Pertanyaan & Jawaban)
            }
        });

        if (!detail) return res.status(404).json({ success: false, message: "Data tidak ditemukan" });

        res.json({ success: true, data: detail });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat detail" });
    }
};

// 3. POST: Kirim Feedback Layanan
exports.kirimFeedbackLayanan = async (req, res) => {
    const userId = req.user.id;
    const { id_riwayat, rating, isi_text } = req.body;

    try {
        await prisma.feedback.create({
            data: {
                id_user: userId,
                id_riwayat_layanan: parseInt(id_riwayat),
                rating: parseInt(rating),
                isi_text: isi_text,
                tanggal: new Date(),
                is_active: true
            }
        });

        res.json({ success: true, message: "Terima kasih atas masukan Anda!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal mengirim feedback" });
    }
};