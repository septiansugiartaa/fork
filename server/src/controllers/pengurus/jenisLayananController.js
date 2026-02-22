const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Semua Jenis Layanan
exports.getJenisLayanan = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true
        };

        if (search) {
            whereCondition.nama_layanan = { contains: search };
        }

        const layanan = await prisma.jenis_layanan.findMany({
            where: whereCondition,
            orderBy: { nama_layanan: 'asc' }
        });

        res.json({ success: true, data: layanan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data layanan" });
    }
};

// 2. POST: Tambah Jenis Layanan
exports.createJenisLayanan = async (req, res) => {
    const { nama_layanan, estimasi, deskripsi } = req.body;

    try {
        await prisma.jenis_layanan.create({
            data: {
                nama_layanan,
                estimasi,
                deskripsi,
                is_active: true
            }
        });

        res.json({ success: true, message: "Layanan berhasil ditambahkan" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menambah layanan" });
    }
};

// 3. PUT: Update Jenis Layanan
exports.updateJenisLayanan = async (req, res) => {
    const { id } = req.params;
    const { nama_layanan, estimasi, deskripsi } = req.body;

    try {
        await prisma.jenis_layanan.update({
            where: { id: parseInt(id) },
            data: {
                nama_layanan,
                estimasi,
                deskripsi
            }
        });

        res.json({ success: true, message: "Layanan berhasil diperbarui" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal update layanan" });
    }
};

// 4. DELETE: Soft Delete
exports.deleteJenisLayanan = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.jenis_layanan.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        res.json({ success: true, message: "Layanan berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menghapus layanan" });
    }
};