const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET: Ambil Semua Riwayat Layanan
exports.getRiwayatLayanan = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true
        };

        if (search) {
            whereCondition.OR = [
                { users: { nama: { contains: search } } },
                { jenis_layanan: { nama_layanan: { contains: search } } }
            ];
        }

        const riwayat = await prisma.riwayat_layanan.findMany({
            where: whereCondition,
            orderBy: { waktu: 'desc' },
            include: {
                users: {
                    select: { nama: true, nip: true, foto_profil:true }
                },
                jenis_layanan: {
                    select: { nama_layanan: true }
                },
                // Include Detail Form
                riwayat_layanan_detail: {
                    where: { is_active: true }
                },
                // Include Feedback
                feedback: {
                    where: { is_active: true },
                    select: { rating: true, isi_text: true, tanggal: true }
                }
            }
        });

        res.json({ success: true, data: riwayat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat riwayat layanan" });
    }
};

// PUT: Update Status (Opsional, buat fitur approval kedepannya)
exports.updateStatusLayanan = async (req, res) => {
    const { id } = req.params;
    const { status_sesudah, catatan } = req.body; // Enum: Proses, Selesai, Batal

    try {
        await prisma.riwayat_layanan.update({
            where: { id: parseInt(id) },
            data: {
                status_sesudah: status_sesudah,
                catatan: catatan
            }
        });
        res.json({ success: true, message: "Status layanan diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal update status" });
    }
};