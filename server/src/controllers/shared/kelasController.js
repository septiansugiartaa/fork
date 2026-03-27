const prisma = require('../../config/prisma');

// ─── KELAS CRUD ───────────────────────────────────────────────────────────────

exports.getKelas = async (req, res) => {
    try {
        const { search } = req.query;
        const kelas = await prisma.kelas.findMany({
            where:   { is_active: true, kelas: { contains: search || '' } },
            orderBy: { kelas: 'asc' },
            include: {
                users:  { select: { nama: true, nip: true } },
                _count: { select: { kelas_santri: { where: { is_active: true } } } },
            },
        });
        return res.json({ success: true, data: kelas });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data kelas.' });
    }
};

exports.getSantriByKelas = async (req, res) => {
    const { id } = req.params;
    try {
        const santriList = await prisma.kelas_santri.findMany({
            where:   { id_kelas: parseInt(id), is_active: true },
            include: { users: { where: { is_active: true }, select: { id: true, nama: true, nip: true, foto_profil: true } } },
            orderBy: { users: { nama: 'asc' } },
        });
        const data = santriList.map(item => item.users);
        return res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data santri kelas.' });
    }
};

exports.getWaliOptions = async (req, res) => {
    try {
        const wali = await prisma.users.findMany({
            where:   { is_active: true, user_role: { some: { role: { role: 'Ustadz' } } } },
            select:  { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' },
        });
        return res.json({ success: true, data: wali });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data wali.' });
    }
};

exports.createKelas = async (req, res) => {
    const { kelas, tahun_ajaran, id_wali } = req.body;
    try {
        await prisma.kelas.create({ data: { kelas, tahun_ajaran, id_wali: parseInt(id_wali) || null, is_active: true } });
        return res.json({ success: true, message: 'Kelas berhasil dibuat.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal membuat kelas.' });
    }
};

exports.updateKelas = async (req, res) => {
    const { id } = req.params;
    const { kelas, tahun_ajaran, id_wali } = req.body;
    try {
        await prisma.kelas.update({ where: { id: parseInt(id) }, data: { kelas, tahun_ajaran, id_wali: parseInt(id_wali) || null } });
        return res.json({ success: true, message: 'Kelas berhasil diperbarui.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal update kelas.' });
    }
};

exports.deleteKelas = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kelas.update({ where: { id: parseInt(id) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Kelas dihapus.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus kelas.' });
    }
};

exports.removeSantriFromKelas = async (req, res) => {
    const { idKelas, idSantri } = req.params;
    try {
        const record = await prisma.kelas_santri.findFirst({
            where: { id_kelas: parseInt(idKelas), id_santri: parseInt(idSantri), is_active: true },
        });
        if (!record) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan di kelas ini.' });
        await prisma.kelas_santri.update({ where: { id: record.id }, data: { is_active: false } });
        return res.json({ success: true, message: 'Santri berhasil dikeluarkan dari kelas.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus santri dari kelas.' });
    }
};

// ─── ASSIGN KELAS ─────────────────────────────────────────────────────────────

exports.getAssignKelas = async (req, res) => {
    try {
        const { search } = req.query;
        const data = await prisma.kelas_santri.findMany({
            where:   { is_active: true, users: { nama: { contains: search || '' } } },
            include: {
                users: { select: { id: true, nama: true, nip: true } },
                kelas: { select: { id: true, kelas: true, tahun_ajaran: true } },
            },
            orderBy: { id: 'desc' },
        });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data kelas santri.' });
    }
};

exports.getOptions = async (req, res) => {
    try {
        const santri = await prisma.users.findMany({
            where: { is_active: true, user_role: { some: { id_role: 1 } }, kelas_santri: { none: { is_active: true } } },
            select: { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' },
        });
        const kelas = await prisma.kelas.findMany({ where: { is_active: true }, orderBy: { kelas: 'asc' } });
        return res.json({ success: true, santri, kelas });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat options.' });
    }
};

exports.createAssignKelas = async (req, res) => {
    const { id_santri, id_kelas } = req.body;
    try {
        await prisma.kelas_santri.create({ data: { id_santri: parseInt(id_santri), id_kelas: parseInt(id_kelas), is_active: true } });
        return res.json({ success: true, message: 'Santri berhasil dimasukkan ke kelas.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal assign kelas.' });
    }
};

exports.updateAssignKelas = async (req, res) => {
    const { id } = req.params;
    const { id_kelas } = req.body;
    try {
        await prisma.kelas_santri.update({ where: { id: parseInt(id) }, data: { id_kelas: parseInt(id_kelas) } });
        return res.json({ success: true, message: 'Kelas berhasil diperbarui.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal update kelas.' });
    }
};

exports.deleteAssignKelas = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kelas_santri.update({ where: { id: parseInt(id) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Santri dikeluarkan dari kelas.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};
