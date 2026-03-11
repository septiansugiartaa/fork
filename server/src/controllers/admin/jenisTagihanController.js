const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get All (dengan fitur search)
exports.getAll = async (req, res) => {
    try {
        const { search } = req.query;
        
        const data = await prisma.jenis_tagihan.findMany({
            where: {
                is_active: true,
                ...(search && {
                    jenis_tagihan: { contains: search }
                })
            },
            orderBy: {
                id: 'desc'
            }
        });

        res.json({ success: true, data });
    } catch (err) {
        console.error("Error get jenis tagihan:", err);
        res.status(500).json({ success: false, message: "Gagal memuat data" });
    }
};

// 2. Create
exports.create = async (req, res) => {
    try {
        const { jenis_tagihan } = req.body;

        const newData = await prisma.jenis_tagihan.create({
            data: {
                jenis_tagihan,
                is_active: true
            }
        });

        res.json({ success: true, message: "Berhasil ditambahkan", data: newData });
    } catch (err) {
        console.error("Error create jenis tagihan:", err);
        res.status(500).json({ success: false, message: "Gagal menambah data" });
    }
};

// 3. Update
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { jenis_tagihan } = req.body;

        const updatedData = await prisma.jenis_tagihan.update({
            where: { id: parseInt(id) },
            data: { jenis_tagihan }
        });

        res.json({ success: true, message: "Berhasil diperbarui", data: updatedData });
    } catch (err) {
        console.error("Error update jenis tagihan:", err);
        res.status(500).json({ success: false, message: "Gagal memperbarui data" });
    }
};

// 4. Soft Delete
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;

        // Menggunakan soft delete sesuai best practice is_active
        await prisma.jenis_tagihan.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        res.json({ success: true, message: "Berhasil dihapus" });
    } catch (err) {
        console.error("Error delete jenis tagihan:", err);
        res.status(500).json({ success: false, message: "Gagal menghapus data" });
    }
};