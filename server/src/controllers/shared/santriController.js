const prisma  = require('../../config/prisma');
const bcrypt  = require('bcryptjs');

// Controller ini dipakai bersama oleh route admin DAN pengurus.
// Tidak ada duplikasi — perbedaan permission ditangani di level route
// menggunakan middleware requireRole.

exports.getSantri = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true,
            user_role: { some: { id_role: 1 } },
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { nip:  { contains: search } },
            ];
        }

        const santriList = await prisma.users.findMany({
            where:   whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id:             true,
                nip:            true,
                nama:           true,
                email:          true,
                no_hp:          true,
                alamat:         true,
                jenis_kelamin:  true,
                tempat_lahir:   true,
                tanggal_lahir:  true,
                foto_profil:    true,
                is_active:      true,
                kelas_santri: {
                    where:  { is_active: true },
                    take:   1,
                    select: { kelas: { select: { kelas: true } } },
                },
                kamar_santri: {
                    where:  { is_active: true },
                    take:   1,
                    select: { kamar: { select: { kamar: true, lokasi: true } } },
                },
                _count: {
                    select: { orangtua_orangtua_id_santriTousers: { where: { is_active: true } } },
                },
            },
        });

        const formattedData = santriList.map(santri => ({
            ...santri,
            kelas_aktif:  santri.kelas_santri[0]?.kelas?.kelas || '-',
            kamar_aktif:  santri.kamar_santri[0]?.kamar?.kamar || '-',
            jumlah_ortu:  santri._count.orangtua_orangtua_id_santriTousers,
        }));

        return res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error('getSantri error:', error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data santri.' });
    }
};

exports.createSantri = async (req, res) => {
    const { nip, nama, email, no_hp, password, jenis_kelamin, alamat, tempat_lahir, tanggal_lahir } = req.body;

    try {
        const existingSantri = await prisma.users.findFirst({ where: { nip, is_active: true } });
        if (existingSantri) {
            return res.status(400).json({ message: 'NIP sudah terdaftar.' });
        }

        const hashedPassword = await bcrypt.hash(password || nip, 10);

        const newSantri = await prisma.users.create({
            data: {
                nip, nama, email, no_hp, alamat, jenis_kelamin,
                tempat_lahir,
                tanggal_lahir:  new Date(tanggal_lahir),
                password:       hashedPassword,
                is_active:      true,
                user_role: { create: { id_role: 1 } },
            },
        });

        return res.json({ success: true, message: 'Santri berhasil ditambahkan.', data: newSantri });
    } catch (error) {
        console.error('createSantri error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menambah santri.' });
    }
};

exports.updateSantri = async (req, res) => {
    const { id } = req.params;
    const { nip, nama, email, no_hp, alamat, jenis_kelamin, tempat_lahir, tanggal_lahir, password } = req.body;

    try {
        const updateData = { nip, nama, email, no_hp, alamat, jenis_kelamin, tempat_lahir, tanggal_lahir: new Date(tanggal_lahir) };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.users.update({ where: { id: parseInt(id) }, data: updateData });

        return res.json({ success: true, message: 'Data santri berhasil diperbarui.' });
    } catch (error) {
        console.error('updateSantri error:', error);
        return res.status(500).json({ success: false, message: 'Data santri harus terisi lengkap.' });
    }
};

exports.deleteSantri = async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        await prisma.$transaction([
            prisma.users.update({ where: { id: userId }, data: { is_active: false } }),
            prisma.user_role.updateMany({ where: { id_user: userId }, data: { is_active: false } }),
            prisma.kamar_santri.updateMany({ where: { id_santri: userId, is_active: true }, data: { is_active: false, tanggal_keluar: new Date() } }),
            prisma.kelas_santri.updateMany({ where: { id_santri: userId, is_active: true }, data: { is_active: false } }),
            prisma.orangtua.updateMany({ where: { id_santri: userId }, data: { is_active: false } }),
        ]);

        return res.json({ success: true, message: 'Santri beserta seluruh relasi datanya berhasil dinonaktifkan.' });
    } catch (error) {
        console.error('deleteSantri error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menonaktifkan santri.' });
    }
};

exports.getOrtuBySantri = async (req, res) => {
    try {
        const { id } = req.params;
        const relasi = await prisma.orangtua.findMany({
            where: { id_santri: parseInt(id), is_active: true },
            include: {
                users_orangtua_id_orangtuaTousers: {
                    select: { id: true, nama: true, no_hp: true, foto_profil: true },
                },
            },
        });

        const data = relasi.map(r => ({
            id_relasi:   r.id,
            id_ortu:     r.users_orangtua_id_orangtuaTousers.id,
            nama:        r.users_orangtua_id_orangtuaTousers.nama,
            no_hp:       r.users_orangtua_id_orangtuaTousers.no_hp,
            foto_profil: r.users_orangtua_id_orangtuaTousers.foto_profil,
            hubungan:    r.hubungan,
        }));

        return res.json({ success: true, data });
    } catch (error) {
        console.error('getOrtuBySantri error:', error);
        return res.status(500).json({ success: false, message: 'Gagal memuat data orang tua.' });
    }
};
