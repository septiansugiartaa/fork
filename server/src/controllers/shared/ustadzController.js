const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');

exports.getUstadz = async (req, res) => {
    try {
        const { search } = req.query;
        const whereCondition = {
            is_active: true,
            user_role: { some: { role: { role: 'Ustadz' } } },
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { nip:  { contains: search } },
            ];
        }

        const ustadzList = await prisma.users.findMany({
            where:   whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id: true, nip: true, nama: true, email: true,
                no_hp: true, jenis_kelamin: true, alamat: true, is_active: true,
            },
        });

        return res.json({ success: true, data: ustadzList });
    } catch (error) {
        console.error('getUstadz error:', error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data ustadz.' });
    }
};

exports.createUstadz = async (req, res) => {
    const { nip, nama, email, no_hp, jenis_kelamin, password, alamat } = req.body;

    try {
        if (nip) {
            const existing = await prisma.users.findFirst({ where: { nip, is_active: true } });
            if (existing) return res.status(400).json({ message: 'NIP sudah terdaftar.' });
        }

        // Default password wajib minimal 8 karakter
        const defaultPass    = '12345678';
        const hashedPassword = await bcrypt.hash(password || defaultPass, 10);

        const newUstadz = await prisma.users.create({
            data: {
                nip: nip || null, nama,
                email: email || null,
                no_hp: no_hp || null,
                jenis_kelamin: jenis_kelamin || null,
                alamat: alamat || null,
                password: hashedPassword,
                is_active: true,
                user_role: { create: { id_role: 3 } },
            },
        });

        return res.json({ success: true, message: 'Ustadz berhasil ditambahkan.', data: newUstadz });
    } catch (error) {
        console.error('createUstadz error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menambah ustadz.' });
    }
};

exports.updateUstadz = async (req, res) => {
    const { id } = req.params;
    const { nip, nama, email, no_hp, jenis_kelamin, alamat, password } = req.body;

    try {
        const updateData = {
            nip: nip || null, nama,
            email: email || null,
            no_hp: no_hp || null,
            jenis_kelamin: jenis_kelamin || null,
            alamat: alamat || null,
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.users.update({ where: { id: parseInt(id) }, data: updateData });

        return res.json({ success: true, message: 'Data ustadz berhasil diperbarui.' });
    } catch (error) {
        console.error('updateUstadz error:', error);
        return res.status(500).json({ success: false, message: 'Gagal update data.' });
    }
};

exports.deleteUstadz = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.users.update({ where: { id: parseInt(id) }, data: { is_active: false } });
        return res.json({ success: true, message: 'Ustadz berhasil dinonaktifkan.' });
    } catch (error) {
        console.error('deleteUstadz error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menghapus ustadz.' });
    }
};
