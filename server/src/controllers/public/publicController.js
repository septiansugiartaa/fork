const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLandingStats = async (req, res) => {
    try {
        // 1. Hitung Total Santri Aktif
        let totalSantri = await prisma.user_role.count({
            where: {
                role: { role: 'Santri' },
                is_active: true,
                users: { is_active: true }
            }
        });

        if(totalSantri > 10){
            totalSantri = totalSantri - (totalSantri % 10);
        }

        // 2. Hitung Total Pengajar (Ustadz) Aktif
        let totalUstadz = await prisma.user_role.count({
            where: {
                role: { role: 'Ustadz' },
                is_active: true,
                users: { is_active: true }
            }
        });

        if(totalUstadz > 10){
            totalUstadz = totalUstadz - (totalUstadz % 10);
        }        

        res.json({
            success: true,
            data: {
                santri: totalSantri,
                ustadz: totalUstadz
            }
        });

    } catch (error) {
        console.error("Public Stats Error:", error);
        res.status(500).json({ success: false, message: "Gagal memuat statistik publik" });
    }
};