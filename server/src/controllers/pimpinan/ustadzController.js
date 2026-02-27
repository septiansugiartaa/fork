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