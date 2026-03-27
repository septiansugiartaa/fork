const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

exports.getOrangTua = async (req, res) => {
    try {
        const { search } = req.query;
        const whereCondition = {
            is_active: true,
            user_role: { some: { role: { role: 'orangtua' } } },
        };

        if (search) {
            whereCondition.OR = [
                { nama:  { contains: search } },
                { no_hp: { contains: search } },
            ];
        }

        const ortuList = await prisma.users.findMany({
            where:   whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id: true, nama: true, email: true, no_hp: true,
                alamat: true, jenis_kelamin: true, foto_profil: true,
                _count: {
                    select: { orangtua_orangtua_id_orangtuaTousers: { where: { is_active: true } } },
                },
            },
        });

        const formattedData = ortuList.map(ortu => ({
            ...ortu,
            jumlah_anak: ortu._count.orangtua_orangtua_id_orangtuaTousers,
        }));

        return res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('getOrangTua error:', error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data orang tua.' });
    }
};

exports.getAnakByOrtu = async (req, res) => {
    try {
        const { id } = req.params;
        const relasi = await prisma.orangtua.findMany({
            where: { id_orangtua: parseInt(id), is_active: true },
            include: {
                users_orangtua_id_santriTousers: {
                    select: { id: true, nama: true, nip: true, foto_profil: true },
                },
            },
        });

        const data = relasi.map(r => ({
            id_relasi:   r.id,
            id_santri:   r.users_orangtua_id_santriTousers.id,
            nama:        r.users_orangtua_id_santriTousers.nama,
            nip:         r.users_orangtua_id_santriTousers.nip,
            foto_profil: r.users_orangtua_id_santriTousers.foto_profil,
            hubungan:    r.hubungan,
        }));

        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memuat data anak.' });
    }
};

exports.searchUser = async (req, res) => {
    try {
        const { q, role } = req.query;
        if (!q || q.length < 3) return res.json({ success: true, data: [] });

        const users = await prisma.users.findMany({
            where: {
                is_active: true,
                user_role: { some: { role: { role: role } } },
                OR: [
                    { nama:  { contains: q } },
                    { nip:   { contains: q } },
                    { no_hp: { contains: q } },
                ],
            },
            take: 10,
            select: { id: true, nama: true, nip: true, no_hp: true },
        });

        return res.json({ success: true, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal mencari data.' });
    }
};

exports.createOrangTua = async (req, res) => {
    const { nama, email, no_hp, alamat, jenis_kelamin } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(no_hp || '12345678', 10);

        const newOrtu = await prisma.users.create({
            data: {
                nama, email, no_hp, alamat, jenis_kelamin,
                password:  hashedPassword,
                is_active: true,
                user_role: { create: { id_role: 4 } },
            },
        });

        return res.json({ success: true, message: 'Akun Wali berhasil dibuat.', data: newOrtu });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal membuat akun.' });
    }
};

exports.updateOrangTua = async (req, res) => {
    const { id } = req.params;
    const { nama, email, no_hp, alamat, jenis_kelamin } = req.body;
    try {
        await prisma.users.update({
            where: { id: parseInt(id) },
            data:  { nama, email, no_hp, alamat, jenis_kelamin },
        });
        return res.json({ success: true, message: 'Data wali diperbarui.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memperbarui data.' });
    }
};

exports.deleteOrangTua = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await prisma.$transaction([
            prisma.users.update({ where: { id: userId }, data: { is_active: false } }),
            prisma.user_role.updateMany({ where: { id_user: userId }, data: { is_active: false } }),
            prisma.orangtua.updateMany({ where: { id_orangtua: userId }, data: { is_active: false } }),
        ]);
        return res.json({ success: true, message: 'Akun Wali dinonaktifkan.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
    }
};

exports.assignRelasi = async (req, res) => {
    let { id_orangtua, id_santri, hubungan, isManualInput, ortuDataBaru } = req.body;
    try {
        if (isManualInput && ortuDataBaru) {
            const hashedPassword = await bcrypt.hash(ortuDataBaru.no_hp || '12345678', 10);
            const newOrtu = await prisma.users.create({
                data: {
                    nama:      ortuDataBaru.nama,
                    no_hp:     ortuDataBaru.no_hp,
                    password:  hashedPassword,
                    is_active: true,
                    user_role: { create: { id_role: 4 } },
                },
            });
            id_orangtua = newOrtu.id;
        }

        const existingRelasi = await prisma.orangtua.findFirst({
            where: { id_orangtua: parseInt(id_orangtua), id_santri: parseInt(id_santri) },
        });

        if (existingRelasi) {
            if (!existingRelasi.is_active) {
                await prisma.orangtua.update({ where: { id: existingRelasi.id }, data: { is_active: true, hubungan } });
            } else {
                return res.status(400).json({ success: false, message: 'Relasi ini sudah ada!' });
            }
        } else {
            await prisma.orangtua.create({
                data: { id_orangtua: parseInt(id_orangtua), id_santri: parseInt(id_santri), hubungan, is_active: true },
            });
        }

        return res.json({ success: true, message: 'Berhasil menghubungkan data.' });
    } catch (error) {
        console.error('assignRelasi error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menghubungkan data.' });
    }
};

exports.removeRelasi = async (req, res) => {
    try {
        await prisma.orangtua.update({ where: { id: parseInt(req.params.id_relasi) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Relasi berhasil diputus.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Gagal memutus relasi.' });
    }
};
