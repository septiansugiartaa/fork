const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const totalSantri = await prisma.user_role.count({ where: { id_role: 1, is_active: true } });
        const totalUstadz = await prisma.user_role.count({ where: { id_role: 2, is_active: true } });
        
        const userId = req.user.id;
        const pengurus = await prisma.users.findUnique({
            where: { id: userId }
        });
        
        // 1. Okupansi dengan Breakdown Gender
        const kamarBreakdown = await prisma.kamar.findMany({
            where: { is_active: true },
            select: {
                gender: true,
                kapasitas: true,
                kamar_santri: { where: { is_active: true } }
            }
        });

        const okupansiGender = kamarBreakdown.reduce((acc, curr) => {
            const key = curr.gender === 'Laki_laki' ? 'Laki' : 'Perempuan';
            acc[key].kapasitas += curr.kapasitas || 0;
            acc[key].terisi += curr.kamar_santri.length;
            return acc;
        }, { Laki: { kapasitas: 0, terisi: 0 }, Perempuan: { kapasitas: 0, terisi: 0 } });

        // 2. Piutang Detail (Untuk Hover Card)
        const piutangDetail = await prisma.tagihan.findMany({
            where: { status: 'Aktif', is_active: true },
            include: { users: { select: { nama: true } } }
        });

        // Grouping by User
        const userPiutang = Object.values(piutangDetail.reduce((acc, curr) => {
            if (!acc[curr.id_santri]) acc[curr.id_santri] = { nama: curr.users.nama, total: 0 };
            acc[curr.id_santri].total += curr.nominal;
            return acc;
        }, {}));

        // 3. Data Chart (6 Bulan Terakhir)
        const labels = [];
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            
            const total = await prisma.pembayaran.aggregate({
                _sum: { nominal: true },
                where: {
                    status: 'Berhasil',
                    tanggal_bayar: {
                        gte: new Date(year, month - 1, 1),
                        lt: new Date(year, month, 1)
                    }
                }
            });
            
            chartData.push({
                name: d.toLocaleString('id-ID', { month: 'short' }),
                nominal: total._sum.nominal || 0
            });
        }

        res.json({
            success: true,
            stats: {
                pengurus, 
                totalSantri,
                totalUstadz,
                okupansiGender,
                urgensi: {
                    layananPending: await prisma.riwayat_layanan.count({ where: { OR: [{ status_sesudah: 'Proses' }, { status_sesudah: null }], is_active: true } }),
                    verifikasiBayar: await prisma.pembayaran.count({ where: { status: 'Pending', is_active: true } })
                },
                keuangan: {
                    piutang: piutangDetail.reduce((a, b) => a + b.nominal, 0),
                    terbayar: (await prisma.pembayaran.aggregate({ _sum: { nominal: true }, where: { status: 'Berhasil', is_active: true } }))._sum.nominal || 0,
                    userPiutang
                }
            },
            chartData,
            recentLayanan: await prisma.riwayat_layanan.findMany({ where: { status_sesudah: 'Proses', is_active: true }, take: 5, orderBy: { waktu: 'desc' }, include: { users: { select: { nama: true } }, jenis_layanan: { select: { nama_layanan: true } } } }),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};