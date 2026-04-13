const prisma = require('../../config/prisma');

// ─── KAMAR CRUD ───────────────────────────────────────────────────────────────

exports.getKamar = async (req, res) => {
    try {
        const { search } = req.query;
        const kamar = await prisma.kamar.findMany({
            where:   { is_active: true, kamar: { contains: search || '' } },
            orderBy: { kamar: 'asc' },
            include: {
                _count: { select: { kamar_santri: { where: { is_active: true } } } },
                users: { select: { id: true, nama: true, nip: true } } // wali kamar
            },
        });
        return res.json({ success: true, data: kamar });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data kamar.' });
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

exports.getSantriByKamar = async (req, res) => {
    const { id } = req.params;
    try {
        const santriList = await prisma.kamar_santri.findMany({
            where:   { id_kamar: parseInt(id), is_active: true },
            include: { users: { select: { id: true, nama: true, nip: true, foto_profil: true } } },
            orderBy: { users: { nama: 'asc' } },
        });
        const data = santriList.map(item => item.users);
        return res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data santri kamar.' });
    }
};

exports.createKamar = async (req, res) => {
    const { kamar, kapasitas, gender, lokasi, id_wali } = req.body;
    try {
        await prisma.kamar.create({
            data: {
                kamar,
                kapasitas: parseInt(kapasitas) || null,
                gender,
                lokasi,
                id_wali: parseInt(id_wali) || null,
                is_active: true
            }
        });
        return res.json({ success: true, message: 'Kamar berhasil dibuat.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal membuat kamar.' });
    }
};

exports.updateKamar = async (req, res) => {
    const { id } = req.params;
    const { kamar, kapasitas, gender, lokasi, id_wali } = req.body;
    try {
        await prisma.kamar.update({
            where: { id: parseInt(id) },
            data: {
                kamar,
                kapasitas: parseInt(kapasitas) || null,
                gender,
                lokasi,
                id_wali: parseInt(id_wali) || null
            }
        });
        return res.json({ success: true, message: 'Kamar berhasil diperbarui.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal update kamar.' });
    }
};

exports.deleteKamar = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kamar.update({ where: { id: parseInt(id) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Kamar dihapus.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus kamar.' });
    }
};

exports.removeSantriFromKamar = async (req, res) => {
    const { idKamar, idSantri } = req.params;
    try {
        const record = await prisma.kamar_santri.findFirst({
            where: { id_kamar: parseInt(idKamar), id_santri: parseInt(idSantri), is_active: true },
        });
        if (!record) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan.' });
        await prisma.kamar_santri.update({ where: { id: record.id }, data: { is_active: false, tanggal_keluar: new Date() } });
        return res.json({ success: true, message: 'Santri berhasil dikeluarkan dari kamar.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus santri dari kamar.' });
    }
};

// ─── ASSIGN KAMAR ─────────────────────────────────────────────────────────────

exports.getAssignKamar = async (req, res) => {
    try {
        const data = await prisma.kamar_santri.findMany({
            where:   { is_active: true },
            include: { users: true, kamar: true },
            orderBy: { id: 'desc' },
        });
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data.' });
    }
};

exports.getOptions = async (req, res) => {
    try {
        const { gender } = req.query;
        const santri = await prisma.users.findMany({
            where: {
                is_active: true,
                user_role: { some: { id_role: 1 } },
                ...(gender && { jenis_kelamin: gender }),
                kamar_santri: { none: { is_active: true } },
            },
            select:  { id: true, nama: true, nip: true, jenis_kelamin: true },
            orderBy: { nama: 'asc' },
        });
        const kamar = await prisma.kamar.findMany({
            where:   { is_active: true, ...(gender && { gender }) },
            orderBy: { kamar: 'asc' },
        });
        return res.json({ success: true, santri, kamar });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Gagal memuat options.' });
    }
};

exports.createAssignKamar = async (req, res) => {
    const { id_santri, id_kamar } = req.body;
    try {
        await prisma.kamar_santri.create({
            data: { id_santri: parseInt(id_santri), id_kamar: parseInt(id_kamar), tanggal_masuk: new Date(), is_active: true },
        });
        return res.json({ success: true, message: 'Santri berhasil dimasukkan ke kamar.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal assign kamar.' });
    }
};

exports.deleteAssignKamar = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.kamar_santri.update({ where: { id: parseInt(id) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Santri dikeluarkan dari kamar.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};
