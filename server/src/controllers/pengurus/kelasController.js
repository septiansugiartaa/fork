const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Semua Kelas
exports.getKelas = async (req, res) => {
    try {
        const { search } = req.query;
        const kelas = await prisma.kelas.findMany({
            where: {
                is_active: true,
                kelas: { contains: search || '' }
            },
            orderBy: { kelas: 'asc' },
            include: {
                // Include Wali Kelas Info
                users: { 
                    select: { nama: true, nip: true } 
                },
                // Optional: Count active students for UI display if needed
                _count: {
                    select: { kelas_santri: { where: { is_active: true } } }
                }
            }
        });
        res.json({ success: true, data: kelas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data kelas" });
    }
};

// 2. GET: Ambil Santri dalam Kelas Tertentu
exports.getSantriByKelas = async (req, res) => {
    const { id } = req.params;
    try {
        const santriList = await prisma.kelas_santri.findMany({
            where: {
                id_kelas: parseInt(id),
                is_active: true
            },
            include: {
                users: {
                    select: { id: true, nama: true, nip: true, foto_profil: true }
                }
            },
            orderBy: { users: { nama: 'asc' } }
        });

        // Format data to return user details directly
        const data = santriList.map(item => item.users);
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data santri kelas" });
    }
};

// 3. GET: List Calon Wali
exports.getWaliOptions = async (req, res) => {
    try {
        const wali = await prisma.users.findMany({
            where: {
                is_active: true,
                user_role: { some: { role: { role: 'Ustadz' } } }
            },
            select: { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' }
        });
        res.json({ success: true, data: wali });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data wali" });
    }
};

// 4. POST: Tambah Kelas
exports.createKelas = async (req, res) => {
    const { kelas, tahun_ajaran, id_wali } = req.body;
    try {
        await prisma.kelas.create({
            data: {
                kelas,
                tahun_ajaran,
                id_wali: parseInt(id_wali) || null,
                is_active: true
            }
        });
        res.json({ success: true, message: "Kelas berhasil dibuat" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat kelas" });
    }
};

// 5. PUT: Update Kelas
exports.updateKelas = async (req, res) => {
    const { id } = req.params;
    const { kelas, tahun_ajaran, id_wali } = req.body;
    try {
        await prisma.kelas.update({
            where: { id: parseInt(id) },
            data: { 
                kelas, 
                tahun_ajaran, 
                id_wali: parseInt(id_wali) || null 
            }
        });
        res.json({ success: true, message: "Kelas berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal update kelas" });
    }
};

// 6. DELETE: Soft Delete Kelas
exports.deleteKelas = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kelas.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Kelas dihapus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus kelas" });
    }
};

// 7. DELETE: Hapus Santri dari Kelas (Soft Delete di kelas_santri)
exports.removeSantriFromKelas = async (req, res) => {
    const { idKelas, idSantri } = req.params;

    try {
        const record = await prisma.kelas_santri.findFirst({
            where: {
                id_kelas: parseInt(idKelas),
                id_santri: parseInt(idSantri),
                is_active: true
            }
        });

        if (!record) {
            return res.status(404).json({ success: false, message: "Santri tidak ditemukan di kelas ini" });
        }

        await prisma.kelas_santri.update({
            where: { id: record.id },
            data: { is_active: false }
        });

        res.json({ success: true, message: "Santri berhasil dikeluarkan dari kelas" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menghapus santri dari kelas" });
    }
};

// ASSIGN KELAS
// 1. GET: Ambil Data Assign Kelas
exports.getAssignKelas = async (req, res) => {
    try {
        const { search } = req.query;
        
        const data = await prisma.kelas_santri.findMany({
            where: {
                is_active: true,
                users: { nama: { contains: search || '' } } // Search by Nama Santri
            },
            include: {
                users: { select: { id: true, nama: true, nip: true } },
                kelas: { select: { id: true, kelas: true, tahun_ajaran: true } }
            },
            orderBy: { id: 'desc' }
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data kelas santri" });
    }
};

// 2. GET: Ambil Data Options (Untuk Dropdown di Modal)
exports.getOptions = async (req, res) => {
    try {
        const santri = await prisma.users.findMany({
            where: { 
                is_active: true,
                user_role: {
                    some: { id_role: 1 }
                },
                kelas_santri: {
                    none: {
                        is_active: true
                    }
                }
            },
            select: { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' }
        });
        const kelas = await prisma.kelas.findMany({
            where: { is_active: true },
            orderBy: { kelas: 'asc' }
        });

        res.json({ success: true, santri, kelas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat options" });
    }
};

// 3. POST: Assign Santri ke Kelas
exports.createAssignKelas = async (req, res) => {
    const { id_santri, id_kelas } = req.body;
    try {
        // Nonaktifkan kelas sebelumnya jika ada (Opsional, tergantung aturan bisnis)
        // await prisma.kelas_santri.updateMany({ where: { id_santri: parseInt(id_santri) }, data: { is_active: false } });

        await prisma.kelas_santri.create({
            data: {
                id_santri: parseInt(id_santri),
                id_kelas: parseInt(id_kelas),
                is_active: true
            }
        });
        res.json({ success: true, message: "Santri berhasil dimasukkan ke kelas" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal assign kelas" });
    }
};

// 4. PUT: Pindah Kelas (Update)
exports.updateAssignKelas = async (req, res) => {
    const { id } = req.params;
    const { id_kelas } = req.body; // Biasanya cuma kelasnya yang diganti
    try {
        await prisma.kelas_santri.update({
            where: { id: parseInt(id) },
            data: { id_kelas: parseInt(id_kelas) }
        });
        res.json({ success: true, message: "Kelas berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal update kelas" });
    }
};

// 5. DELETE: Hapus dari Kelas
exports.deleteAssignKelas = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kelas_santri.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Santri dikeluarkan dari kelas" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus data" });
    }
};