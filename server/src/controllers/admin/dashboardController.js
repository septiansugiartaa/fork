const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const admin = await prisma.users.findUnique({
            where: { id: userId }
        });

        // 1. STATISTIK PENGGUNA (Total & Berdasarkan Gender)
        const totalUsers = await prisma.users.count({ where: { is_active: true } });
        
        const genderRaw = await prisma.users.groupBy({
            by: ['jenis_kelamin'],
            _count: { jenis_kelamin: true },
            where: { is_active: true }
        });
        
        const genderStats = {
            Laki: genderRaw.find(g => g.jenis_kelamin === 'Laki_laki')?._count.jenis_kelamin || 0,
            Perempuan: genderRaw.find(g => g.jenis_kelamin === 'Perempuan')?._count.jenis_kelamin || 0,
        };

        // 2. DEMOGRAFI HAK AKSES (ROLE) UNTUK PIE CHART
        const rolesRaw = await prisma.user_role.findMany({
            where: { is_active: true },
            include: { role: true }
        });

        const roleCounts = {};
        rolesRaw.forEach(ur => {
            const roleName = ur.role?.role || 'Unknown';
            roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
        });

        const chartDataRole = Object.keys(roleCounts).map(key => ({
            name: key,
            value: roleCounts[key]
        }));

        // 3. STATISTIK MASTER DATA
        const totalKamar = await prisma.kamar.count({ where: { is_active: true } });
        const totalKelas = await prisma.kelas.count({ where: { is_active: true } });
        const totalLayanan = await prisma.jenis_layanan.count({ where: { is_active: true } });
        const totalJenisTagihan = await prisma.jenis_tagihan.count({ where: { is_active: true } });

        // 4. SYSTEM HEALTH (Peringatan Data Anomali/Orphan Data)
        // a. Santri tanpa Kamar
        const santriTanpaKamar = await prisma.user_role.count({
            where: {
                role: { role: 'Santri' },
                is_active: true,
                users: {
                    kamar_santri: { none: { is_active: true } }
                }
            }
        });

        // b. Santri tanpa Kelas
        const santriTanpaKelas = await prisma.user_role.count({
            where: {
                role: { role: 'Santri' },
                is_active: true,
                users: {
                    kelas_santri: { none: { is_active: true } }
                }
            }
        });

        // 5. ACTIVITY LOG TERBARU (Data untuk Timeline Frontend)
        const recentLogs = await prisma.activity_log.findMany({
            take: 5,
            orderBy: { created_at: 'desc' }
        });

        // 6. KIRIM RESPONSE KE FRONTEND
        res.json({
            success: true,
            stats: {
                admin,
                totalUsers,
                genderStats,
                masterData: {
                    kamar: totalKamar,
                    kelas: totalKelas,
                    layanan: totalLayanan,
                    tagihan: totalJenisTagihan
                },
                systemHealth: {
                    orphanKamar: santriTanpaKamar,
                    orphanKelas: santriTanpaKelas
                }
            },
            chartDataRole,
            recentLogs
        });

    } catch (error) {
        console.error("Error get admin dashboard:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data dashboard" });
    }
};