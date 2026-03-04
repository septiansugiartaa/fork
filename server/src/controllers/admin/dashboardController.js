const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const adminData = await prisma.users.findUnique({
            where: { id: userId },
            select: { 
                nama: true, 
                user_role: {
                    where: { is_active: true },
                    include: { role: true }
                }
            }
        });

        const adminRole = adminData.user_role[0]?.role?.role || 'User';

        // 1. GLOBAL STATS
        const totalUsers = await prisma.users.count({ where: { is_active: true } });

        // 2. SANTRI GENDER STATS
        const getSantriCount = async (gender) => {
            return await prisma.user_role.count({
                where: {
                    role: { role: 'Santri' },
                    is_active: true,
                    users: { is_active: true, jenis_kelamin: gender }
                }
            });
        };

        const santriLaki = await getSantriCount('Laki_laki');
        const santriPerempuan = await getSantriCount('Perempuan');
        const totalSantri = santriLaki + santriPerempuan;

        // 3. STAFF STATS (Semua role kecuali Santri & Orang Tua)
        const totalStaff = await prisma.user_role.count({
            where: {
                role: { role: { notIn: ['Santri', 'Orang Tua'] } },
                is_active: true,
                users: { is_active: true }
            }
        });

        // 4. MASTER DATA STATS
        const [kamar, kelas, layanan, tagihan] = await Promise.all([
            prisma.kamar.count({ where: { is_active: true } }),
            prisma.kelas.count({ where: { is_active: true } }),
            prisma.jenis_layanan.count({ where: { is_active: true } }),
            prisma.jenis_tagihan.count({ where: { is_active: true } })
        ]);

        // 5. SYSTEM HEALTH
        const orphanKamar = await prisma.user_role.count({
            where: {
                role: { role: 'Santri' },
                is_active: true,
                users: { kamar_santri: { none: { is_active: true } } }
            }
        });

        const orphanKelas = await prisma.user_role.count({
            where: {
                role: { role: 'Santri' },
                is_active: true,
                users: { kelas_santri: { none: { is_active: true } } }
            }
        });

        // 6. ROLE DISTRIBUTION (Pie Chart)
        const rolesRaw = await prisma.user_role.findMany({
            where: { is_active: true, users: { is_active: true } },
            include: { role: true }
        });

        const roleCounts = {};
        rolesRaw.forEach(ur => {
            const name = ur.role?.role || 'Unknown';
            roleCounts[name] = (roleCounts[name] || 0) + 1;
        });

        const chartDataRole = Object.keys(roleCounts).map(key => ({
            name: key,
            value: roleCounts[key]
        }));

        // 7. RECENT LOGS
        const recentLogs = await prisma.activity_log.findMany({
            take: 5,
            orderBy: { created_at: 'desc' }
        });

        res.json({
            success: true,
            stats: {
                admin: {
                    nama: adminData.nama,
                    role: adminRole // Mengirim string role yang sudah diekstrak
                },
                totalUsers,
                totalSantri,
                totalStaff,
                santriGender: { Laki: santriLaki, Perempuan: santriPerempuan },
                masterData: { kamar, kelas, layanan, tagihan },
                systemHealth: { orphanKamar, orphanKelas }
            },
            chartDataRole,
            recentLogs
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};