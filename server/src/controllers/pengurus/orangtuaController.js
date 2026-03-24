const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// 1. GET: Ambil Semua Data Orang Tua (Role ID = 4 atau 'Orang Tua')
exports.getOrangTua = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true,
            user_role: { some: { role: { role: 'orangtua' } } }
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { no_hp: { contains: search } }
            ];
        }

        const ortuList = await prisma.users.findMany({
            where: whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nama: true,
                email: true,
                no_hp: true,
                alamat: true,
                jenis_kelamin: true,
                foto_profil: true,
                // Hitung jumlah anak yang terhubung dan aktif
                _count: {
                    select: { orangtua_orangtua_id_orangtuaTousers: { where: { is_active: true } } }
                }
            }
        });

        const formattedData = ortuList.map(ortu => ({
            ...ortu,
            jumlah_anak: ortu._count.orangtua_orangtua_id_orangtuaTousers
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data orang tua" });
    }
};

// 2. GET: List Anak spesifik dari satu Orang Tua
exports.getAnakByOrtu = async (req, res) => {
    try {
        const { id } = req.params;
        const relasi = await prisma.orangtua.findMany({
            where: { id_orangtua: parseInt(id), is_active: true },
            include: {
                users_orangtua_id_santriTousers: {
                    select: { id: true, nama: true, nip: true, foto_profil: true }
                }
            }
        });

        const data = relasi.map(r => ({
            id_relasi: r.id,
            id_santri: r.users_orangtua_id_santriTousers.id,
            nama: r.users_orangtua_id_santriTousers.nama,
            nip: r.users_orangtua_id_santriTousers.nip,
            foto_profil: r.users_orangtua_id_santriTousers.foto_profil,
            hubungan: r.hubungan
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data anak" });
    }
};

// 3. GET: Search User (Dinamis untuk Santri atau Orang Tua)
exports.searchUser = async (req, res) => {
    try {
        const { q, role } = req.query; // role = 'Santri' atau 'Orang Tua'
        if (!q || q.length < 3) return res.json({ success: true, data: [] });

        const users = await prisma.users.findMany({
            where: {
                is_active: true,
                user_role: { some: { role: { role: role } } },
                OR: [
                    { nama: { contains: q } },
                    { nip: { contains: q } }, // Berlaku untuk santri
                    { no_hp: { contains: q } } // Berlaku untuk ortu
                ]
            },
            take: 10,
            select: { id: true, nama: true, nip: true, no_hp: true }
        });

        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mencari data" });
    }
};

// 4. POST: Buat Akun Orang Tua Mandiri (Atau dari Modal Manual)
exports.createOrangTua = async (req, res) => {
    const { nama, email, no_hp, alamat, jenis_kelamin } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(no_hp || "123456", 10); // Default pass = no_hp

        const newOrtu = await prisma.users.create({
            data: {
                nama, email, no_hp, alamat, jenis_kelamin,
                password: hashedPassword,
                is_active: true,
                user_role: {
                    create: { id_role: 4 } // Asumsi ID Role 4 = Orang Tua
                }
            }
        });

        res.json({ success: true, message: "Akun Wali berhasil dibuat", data: newOrtu });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat akun" });
    }
};

// 5. PUT: Update Akun Orang Tua
exports.updateOrangTua = async (req, res) => {
    const { id } = req.params;
    const { nama, email, no_hp, alamat, jenis_kelamin } = req.body;

    try {
        await prisma.users.update({
            where: { id: parseInt(id) },
            data: { nama, email, no_hp, alamat, jenis_kelamin }
        });
        res.json({ success: true, message: "Data wali diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memperbarui data" });
    }
};

// 6. DELETE: Soft Delete Akun Orang Tua
exports.deleteOrangTua = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        await prisma.$transaction([
            prisma.users.update({ where: { id: userId }, data: { is_active: false } }),
            prisma.user_role.updateMany({ where: { id_user: userId }, data: { is_active: false } }),
            prisma.orangtua.updateMany({ where: { id_orangtua: userId }, data: { is_active: false } })
        ]);
        res.json({ success: true, message: "Akun Wali dinonaktifkan" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menghapus data" });
    }
};

// 7. POST: Assign Relasi (OrangTua <-> Santri)
exports.assignRelasi = async (req, res) => {
    let { id_orangtua, id_santri, hubungan, isManualInput, ortuDataBaru } = req.body;

    try {
        // Jika input manual dari Modal (Artinya Ortunya belum punya akun)
        if (isManualInput && ortuDataBaru) {
            const hashedPassword = await bcrypt.hash(ortuDataBaru.no_hp || "123456", 10);
            const newOrtu = await prisma.users.create({
                data: {
                    nama: ortuDataBaru.nama,
                    no_hp: ortuDataBaru.no_hp,
                    password: hashedPassword,
                    is_active: true,
                    user_role: { create: { id_role: 4 } }
                }
            });
            id_orangtua = newOrtu.id;
        }

        // Cek apakah relasi sudah ada sebelumnya
        const existingRelasi = await prisma.orangtua.findFirst({
            where: { id_orangtua: parseInt(id_orangtua), id_santri: parseInt(id_santri) }
        });

        if (existingRelasi) {
            // Jika ada tapi mati, aktifkan lagi
            if (!existingRelasi.is_active) {
                await prisma.orangtua.update({
                    where: { id: existingRelasi.id },
                    data: { is_active: true, hubungan }
                });
            } else {
                return res.status(400).json({ success: false, message: "Relasi ini sudah ada!" });
            }
        } else {
            // Buat relasi baru
            await prisma.orangtua.create({
                data: {
                    id_orangtua: parseInt(id_orangtua),
                    id_santri: parseInt(id_santri),
                    hubungan,
                    is_active: true
                }
            });
        }

        res.json({ success: true, message: "Berhasil menghubungkan data" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menghubungkan data" });
    }
};

// 8. DELETE: Putus Relasi Anak dan Orang Tua
exports.removeRelasi = async (req, res) => {
    try {
        await prisma.orangtua.update({
            where: { id: parseInt(req.params.id_relasi) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Relasi berhasil diputus" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memutus relasi" });
    }
};