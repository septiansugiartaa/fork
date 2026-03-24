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
                }
            }
        });

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