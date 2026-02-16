const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// 1. GET: Ambil Semua Data Santri (Role ID = 1)
exports.getSantri = async (req, res) => {
    try {
        const { search } = req.query;

        const whereCondition = {
            is_active: true,
            user_role: {
                some: { id_role: 1 }
            }
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { nip: { contains: search } }
            ];
        }

        const santriList = await prisma.users.findMany({
            where: whereCondition,
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nip: true,
                nama: true,
                email: true,
                no_hp: true,
                alamat: true,
                jenis_kelamin: true,
                tempat_lahir: true,
                tanggal_lahir: true,
                foto_profil: true,
                is_active: true,
                // --- NEW: Fetch Active Class & Room ---
                kelas_santri: {
                    where: { is_active: true },
                    take: 1, // Only get the current/latest active one
                    select: {
                        kelas: { select: { kelas: true } }
                    }
                },
                kamar_santri: {
                    where: { is_active: true },
                    take: 1,
                    select: {
                        kamar: { select: { kamar: true, lokasi: true } }
                    }
                }
                // --------------------------------------
            }
        });

        // Flatten the data structure for easier frontend consumption
        const formattedData = santriList.map(santri => ({
            ...santri,
            kelas_aktif: santri.kelas_santri[0]?.kelas?.kelas || "-",
            kamar_aktif: santri.kamar_santri[0]?.kamar?.kamar || "-"
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat data santri" });
    }
};

// 2. POST: Tambah Santri Baru
exports.createSantri = async (req, res) => {
    const { nip, nama, email, no_hp, password, jenis_kelamin, alamat, tempat_lahir, tanggal_lahir } = req.body;

    try {
        // Cek NIP duplikat
        const existingSantri = await prisma.users.findFirst({
            where: { nip, is_active: true }
        });
        if (existingSantri) return res.status(400).json({ message: "NIP sudah terdaftar" });

        // Hash Password (Default NIP jika kosong)
        const hashedPassword = await bcrypt.hash(password || nip, 10);

        // Transaction: Create User + Assign Role
        const newSantri = await prisma.users.create({
            data: {
                nip,
                nama,
                email,
                no_hp,
                alamat,
                jenis_kelamin, // Pastikan format Enum sesuai ('Laki_laki' / 'Perempuan')
                tempat_lahir,
                tanggal_lahir: new Date(tanggal_lahir),
                password: hashedPassword,
                is_active: true,
                user_role: {
                    create: { id_role: 1 } // Assign Role ID 1 (Santri)
                }
            }
        });

        res.json({ success: true, message: "Santri berhasil ditambahkan", data: newSantri });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menambah santri" });
    }
};

// 3. PUT: Update Data Santri
exports.updateSantri = async (req, res) => {
    const { id } = req.params;
    const { nip, nama, email, no_hp, alamat, jenis_kelamin, tempat_lahir, tanggal_lahir, password } = req.body;

    try {
        const updateData = {
            nip,
            nama,
            email,
            no_hp,
            alamat,
            jenis_kelamin,
            tempat_lahir,
            tanggal_lahir: new Date(tanggal_lahir)
        };

        // Update password hanya jika diisi
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.users.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({ success: true, message: "Data santri berhasil diperbarui" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Data santri harus terisi lengkap" });
    }
};

// 4. DELETE: Soft Delete (Set is_active = false)
exports.deleteSantri = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.users.update({
            where: { id: parseInt(id) },
            data: { is_active: false } // Soft Delete
        });

        res.json({ success: true, message: "Santri berhasil dinonaktifkan" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menghapus santri" });
    }
};