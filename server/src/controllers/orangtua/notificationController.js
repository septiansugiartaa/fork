const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getOrtuNotifs = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.users.findUnique({ where: { id: userId } });
        
        // Ambil semua anak yang terhubung
        const relasiAll = await prisma.orangtua.findMany({ where: { id_orangtua: userId, is_active: true } });
        let notifs = [];
        
        if (relasiAll.length > 0) {
            const idAnakList = relasiAll.map(r => r.id_santri);

            const tagihan = await prisma.tagihan.findMany({
                where: { id_santri: { in: idAnakList }, status: 'Aktif' },
                take: 5, orderBy: { tanggal_tagihan: 'desc' }
            });
            tagihan.forEach(t => {
                notifs.push({
                    tipe: 'keuangan', judul: "Tagihan Santri",
                    pesan: `Mohon selesaikan tagihan "${t.nama_tagihan}".`,
                    waktu: t.tanggal_tagihan, url: '/orangtua/keuangan',
                    is_new: user.last_opened_notif ? new Date(t.tanggal_tagihan) > new Date(user.last_opened_notif) : true
                });
            });

            const aduanBaru = await prisma.pengaduan.findMany({
                where: { id_santri: { in: idAnakList }, is_active: true },
                take: 5, orderBy: { waktu_aduan: 'desc' }
            });
            aduanBaru.forEach(a => {
                notifs.push({
                    tipe: 'pengaduan', judul: "Catatan Santri Baru",
                    pesan: `Laporan terkait anak Anda: "${a.judul || a.deskripsi.substring(0,30)}"`,
                    waktu: a.waktu_aduan, url: '/orangtua/pengaduan',
                    is_new: user.last_opened_notif ? new Date(a.waktu_aduan) > new Date(user.last_opened_notif) : true
                });
            });
        }

        notifs.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
        res.json({ success: true, data: notifs.slice(0, 10) });
    } catch (error) { res.status(500).json({ success: false }); }
};

exports.markAsRead = async (req, res) => {
    try {
        await prisma.users.update({ where: { id: req.user.id }, data: { last_opened_notif: new Date() } });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};