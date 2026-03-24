const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Ambil Notifikasi Santri
exports.getSantriNotifs = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.users.findUnique({ where: { id: userId } });
        let notifs = [];

        // A. Tagihan Aktif
        const tagihan = await prisma.tagihan.findMany({
            where: { id_santri: userId, status: 'Aktif' },
            take: 3, orderBy: { tanggal_tagihan: 'desc' }
        });
        tagihan.forEach(t => {
            notifs.push({
                tipe: 'keuangan', judul: "Informasi Tagihan",
                pesan: `Anda memiliki tagihan "${t.nama_tagihan}" yang belum lunas.`,
                waktu: t.tanggal_tagihan, url: '/santri/keuangan',
                is_new: user.last_opened_notif ? new Date(t.tanggal_tagihan) > new Date(user.last_opened_notif) : true
            });
        });

        // B. PERBAIKAN: Pengaduan/Laporan Baru (Dari Ustadz ke Santri)
        const aduanBaru = await prisma.pengaduan.findMany({
            where: { id_santri: userId, is_active: true },
            take: 3, orderBy: { waktu_aduan: 'desc' }
        });
        aduanBaru.forEach(a => {
            notifs.push({
                tipe: 'pengaduan', judul: "Catatan Laporan Baru",
                pesan: `Ada catatan baru: "${a.judul || a.deskripsi.substring(0,30)}"`,
                waktu: a.waktu_aduan, url: '/santri/pengaduan',
                is_new: user.last_opened_notif ? new Date(a.waktu_aduan) > new Date(user.last_opened_notif) : true
            });
        });

        // C. Screening Scabies Terakhir
        const screening = await prisma.screening.findMany({
            where: { id_santri: userId },
            take: 1, orderBy: { tanggal: 'desc' }
        });
        if(screening.length > 0) {
            notifs.push({
                tipe: 'kesehatan', judul: "Hasil Screening Kesehatan",
                pesan: `Diagnosa terakhir: ${screening[0].diagnosa.replace(/_/g, ' ')}`,
                waktu: screening[0].tanggal, url: '/santri/kesehatan',
                is_new: user.last_opened_notif ? new Date(screening[0].tanggal) > new Date(user.last_opened_notif) : true
            });
        }

        notifs.sort((a, b) => new Date(b.waktu) - new Date(a.waktu));
        res.json({ success: true, data: notifs.slice(0, 10) });
    } catch (error) { res.status(500).json({ success: false }); }
};

// 2. Tandai Notif Dibaca
exports.markAsRead = async (req, res) => {
    try {
        await prisma.users.update({
            where: { id: req.user.id },
            data: { last_opened_notif: new Date() }
        });
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};