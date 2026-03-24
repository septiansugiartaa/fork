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
                kelas_santri: {
                    where: { is_active: true },
                    take: 1, 
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
                },
                _count: {
                    select: { orangtua_orangtua_id_santriTousers: { where: { is_active: true } } }
                }
            }
        });

        // Flatten the data structure for easier frontend consumption
        const formattedData = santriList.map(santri => ({
            ...santri,
            kelas_aktif: santri.kelas_santri[0]?.kelas?.kelas || "-",
            kamar_aktif: santri.kamar_santri[0]?.kamar?.kamar || "-",
            jumlah_ortu: santri._count.orangtua_orangtua_id_santriTousers
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

// 4. DELETE: Cascading Soft Delete (Set is_active = false)
exports.deleteSantri = async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    try {
        await prisma.$transaction([
            // 1. Nonaktifkan User utama
            prisma.users.update({
                where: { id: userId },
                data: { is_active: false }
            }),
            
            // 2. Nonaktifkan Role-nya
            prisma.user_role.updateMany({
                where: { id_user: userId },
                data: { is_active: false }
            }),

            // 3. Keluarkan dari Kamar aktif
            prisma.kamar_santri.updateMany({
                where: { id_santri: userId, is_active: true },
                data: { 
                    is_active: false,
                    tanggal_keluar: new Date()
                }
            }),

            // 4. Keluarkan dari Kelas aktif
            prisma.kelas_santri.updateMany({
                where: { id_santri: userId, is_active: true },
                data: { is_active: false }
            }),

            // 5. Nonaktifkan relasi Wali / Orang Tuanya
            prisma.orangtua.updateMany({
                where: { id_santri: userId },
                data: { is_active: false }
            })
        ]);

        res.json({ success: true, message: "Santri beserta seluruh relasi datanya berhasil dinonaktifkan" });
    } catch (error) {
        console.error("Error Soft Delete Santri:", error);
        res.status(500).json({ success: false, message: "Gagal menonaktifkan santri beserta datanya" });
    }
};

// 5. GET: Daftar Orang Tua/Wali
exports.getOrtuBySantri = async (req, res) => {
    try {
        const { id } = req.params;
        const relasi = await prisma.orangtua.findMany({
            where: { id_santri: parseInt(id), is_active: true },
            include: {
                users_orangtua_id_orangtuaTousers: {
                    select: { id: true, nama: true, no_hp: true, foto_profil: true }
                }
            }
        });

        const data = relasi.map(r => ({
            id_relasi: r.id,
            id_ortu: r.users_orangtua_id_orangtuaTousers.id,
            nama: r.users_orangtua_id_orangtuaTousers.nama,
            no_hp: r.users_orangtua_id_orangtuaTousers.no_hp,
            foto_profil: r.users_orangtua_id_orangtuaTousers.foto_profil,
            hubungan: r.hubungan
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat data orang tua" });
    }
};