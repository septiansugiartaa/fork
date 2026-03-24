const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUstadzNotifs = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.users.findUnique({ where: { id: userId } });
        let notifs = [];

        // A. PERBAIKAN: Tanggapan Baru (Masuk pada laporan yang dibuat Ustadz ini)
        const aduanDitanggapi = await prisma.pengaduan.findMany({
            where: { id_pelapor: userId, tanggapan_aduan: { some: {} } },
            include: { tanggapan_aduan: { orderBy: { waktu_tanggapan: 'desc' }, take: 1 } },
            take: 5
        });
        
        aduanDitanggapi.forEach(a => {
            if(a.tanggapan_aduan.length > 0) {
                const tanggapanTerbaru = a.tanggapan_aduan[0];
                notifs.push({
                    tipe: 'pengaduan', judul: "Tanggapan Laporan Baru",
                    pesan: `Ada tanggapan pada laporan Anda: "${a.judul || a.deskripsi.substring(0,30)}"`,
                    waktu: tanggapanTerbaru.waktu_tanggapan, url: `/ustadz/pengaduan/${a.id}`,
                    is_new: user.last_opened_notif ? new Date(tanggapanTerbaru.waktu_tanggapan) > new Date(user.last_opened_notif) : true
                });
            }
        });

        // B. Jadwal Kegiatan dimana ia jadi PJ
        const hariIni = new Date();
        const besok = new Date(hariIni); besok.setDate(besok.getDate() + 1);
        
        const jadwal = await prisma.kegiatan.findMany({
            where: { penanggung_jawab: userId, tanggal: { gte: hariIni, lte: besok }, is_active: true },
            orderBy: { tanggal: 'asc' }
        });
        jadwal.forEach(j => {
            notifs.push({
                tipe: 'kegiatan', judul: "Pengingat Jadwal",
                pesan: `Anda memiliki kegiatan "${j.nama_kegiatan}" dalam waktu dekat.`,
                waktu: j.tanggal, url: '/ustadz/kegiatan',
                is_new: user.last_opened_notif ? new Date(j.tanggal) > new Date(user.last_opened_notif) : true
            });
        });

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