const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Semua Kamar
exports.getKamar = async (req, res) => {
    try {
        const { search } = req.query;
        const kamar = await prisma.kamar.findMany({
            where: {
                is_active: true,
                kamar: { contains: search || '' }
            },
            orderBy: { kamar: 'asc' },
            include: {
                _count: {
                    select: { kamar_santri: { where: { is_active: true } } }
                }
            }
        });
        res.json({ success: true, data: kamar });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data kamar" });
    }
};

// 2. GET: Ambil Santri dalam Kamar Tertentu
exports.getSantriByKamar = async (req, res) => {
    const { id } = req.params;
    try {
        const santriList = await prisma.kamar_santri.findMany({
            where: {
                id_kamar: parseInt(id),
                is_active: true
            },
            include: {
                users: {
                    select: { id: true, nama: true, nip: true, foto_profil: true }
                }
            },
            orderBy: { users: { nama: 'asc' } }
        });

        const data = santriList.map(item => item.users);
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data santri kamar" });
    }
};

// 3. POST: Tambah Kamar
exports.createKamar = async (req, res) => {
    const { kamar, kapasitas, gender, lokasi } = req.body;
    try {
        await prisma.kamar.create({
            data: {
                kamar,
                kapasitas: parseInt(kapasitas),
                gender,
                lokasi,
                is_active: true
            }
        });
        res.json({ success: true, message: "Kamar berhasil dibuat" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat kamar" });
    }
};

// 4. PUT: Update Kamar
exports.updateKamar = async (req, res) => {
    const { id } = req.params;
    const { kamar, kapasitas, gender, lokasi } = req.body;
    try {
        await prisma.kamar.update({
            where: { id: parseInt(id) },
            data: { kamar, kapasitas: parseInt(kapasitas), gender, lokasi }
        });
        res.json({ success: true, message: "Kamar berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal update kamar" });
    }
};

// 5. DELETE: Soft Delete Kamar
exports.deleteKamar = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kamar.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Kamar dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus kamar" });
    }
};

// 6. DELETE: Hapus Santri dari Kamar
exports.removeSantriFromKamar = async (req, res) => {
    const { idKamar, idSantri } = req.params;
    try {
        const record = await prisma.kamar_santri.findFirst({
            where: {
                id_kamar: parseInt(idKamar),
                id_santri: parseInt(idSantri),
                is_active: true
            }
        });

        if (!record) return res.status(404).json({ success: false, message: "Santri tidak ditemukan" });

        await prisma.kamar_santri.update({
            where: { id: record.id },
            data: { is_active: false, tanggal_keluar: new Date() } // Set tanggal keluar juga
        });

        res.json({ success: true, message: "Santri berhasil dikeluarkan dari kamar" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus santri dari kamar" });
    }
};

// ASSIGN KAMAR
// 1. GET: Ambil Data Assign (Optional)
exports.getAssignKamar = async (req, res) => {
    try {
        const data = await prisma.kamar_santri.findMany({
            where: { is_active: true },
            include: { users: true, kamar: true },
            orderBy: { id: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data" });
    }
};

// 2. GET: Options
exports.getOptions = async (req, res) => {
    try {
        const { gender } = req.query; 

        const santri = await prisma.users.findMany({
            where: { 
                is_active: true,
                user_role: { some: { id_role: 1 } },

                ...(gender && { jenis_kelamin: gender }),

                kamar_santri: {
                    none: { is_active: true }
                }
            },
            select: { id: true, nama: true, nip: true, jenis_kelamin: true },
            orderBy: { nama: 'asc' }
        });

        const kamar = await prisma.kamar.findMany({
            where: { 
                is_active: true,
                ...(gender && { gender: gender }) 
            },
            orderBy: { kamar: 'asc' }
        });

        res.json({ success: true, santri, kamar });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat options" });
    }
};

// 3. POST: Assign Santri
exports.createAssignKamar = async (req, res) => {
    const { id_santri, id_kamar } = req.body;
    try {
        // Nonaktifkan kamar lama jika ada (opsional, tergantung aturan)
        // await prisma.kamar_santri.updateMany({ where: { id_santri: parseInt(id_santri), is_active: true }, data: { is_active: false, tanggal_keluar: new Date() } });

        await prisma.kamar_santri.create({
            data: {
                id_santri: parseInt(id_santri),
                id_kamar: parseInt(id_kamar),
                tanggal_masuk: new Date(),
                is_active: true
            }
        });
        res.json({ success: true, message: "Santri berhasil dimasukkan ke kamar" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal assign kamar" });
    }
};

// 4. DELETE: Hapus dari Kamar
exports.deleteAssignKamar = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kamar_santri.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Santri dikeluarkan dari kamar" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus data" });
    }
};