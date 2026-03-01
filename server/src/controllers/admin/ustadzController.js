const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// 1. GET: Ambil Semua Data Ustadz
exports.getUstadz = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true,
            user_role: {
                some: { 
                    role: { role: 'Ustadz' } // Filter berdasarkan nama role biar aman
                }
            }
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { nip: { contains: search } }
            ];
        }

        const ustadzList = await prisma.users.findMany({
            where: whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nip: true,
                nama: true,
                email: true,
                no_hp: true,
                jenis_kelamin: true,
                alamat: true,
                is_active: true
            }
        });

        res.json({ success: true, data: ustadzList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data ustadz" });
    }
};

// 2. POST: Tambah Ustadz Baru
exports.createUstadz = async (req, res) => {
    // Ambil data, jika kosong biarkan string kosong atau null (tergantung prisma schema)
    const { nip, nama, email, no_hp, jenis_kelamin, password, alamat } = req.body;

    try {
        // Cek NIP duplikat jika NIP diisi
        if (nip) {
            const existing = await prisma.users.findFirst({
                where: { nip, is_active: true }
            });
            if (existing) return res.status(400).json({ message: "NIP sudah terdaftar" });
        }

        const hashedPassword = await bcrypt.hash(password || "123456", 10); // Default password

        const newUstadz = await prisma.users.create({
            data: {
                nip: nip || null, // Boleh null
                nama,
                email: email || null,
                no_hp: no_hp || null,
                jenis_kelamin: jenis_kelamin || null,
                alamat: alamat || null,
                password: hashedPassword,
                is_active: true,
                user_role: {
                    create: { 
                        id_role: 3
                    } 
                }
            }
        });

        res.json({ success: true, message: "Ustadz berhasil ditambahkan", data: newUstadz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menambah ustadz" });
    }
};

// 3. PUT: Update Data Ustadz
exports.updateUstadz = async (req, res) => {
    const { id } = req.params;
    const { nip, nama, email, no_hp, jenis_kelamin, alamat, password } = req.body;

    try {
        const updateData = {
            nip: nip || null,
            nama,
            email: email || null,
            no_hp: no_hp || null,
            jenis_kelamin: jenis_kelamin || null,
            alamat: alamat || null
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.users.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({ success: true, message: "Data ustadz berhasil diperbarui" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal update data" });
    }
};

// 4. DELETE: Soft Delete
exports.deleteUstadz = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.users.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        res.json({ success: true, message: "Ustadz berhasil dinonaktifkan" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menghapus ustadz" });
    }
};