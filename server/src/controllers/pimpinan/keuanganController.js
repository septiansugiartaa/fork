const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Daftar Tagihan
exports.getTagihan = async (req, res) => {
    try {
        const { search } = req.query;
        const whereCondition = { is_active: true };

        if (search) {
            whereCondition.OR = [
                { nama_tagihan: { contains: search } },
                { users: { nama: { contains: search } } }
            ];
        }

        const tagihan = await prisma.tagihan.findMany({
            where: whereCondition,
            include: {
                users: { select: { nama: true, nip: true } },
                jenis_tagihan: true
            },
            orderBy: [ {status: "asc"}, {tanggal_tagihan: "desc"} ],
        });
        res.json({ success: true, data: tagihan });
    } catch (error) { res.status(500).json({ message: "Gagal memuat data" }); }
};

// 2. GET: List Pembayaran
exports.getPembayaranByTagihan = async (req, res) => {
    const { idTagihan } = req.params;
    try {
        // Kita butuh status tagihan terkini juga
        const tagihan = await prisma.tagihan.findUnique({
            where: { id: parseInt(idTagihan) },
            select: { id: true, status: true, nominal: true }
        });

        const list = await prisma.pembayaran.findMany({
            where: { id_tagihan: parseInt(idTagihan), is_active: true },
            orderBy: { tanggal_bayar: 'desc' }
        });

        res.json({ success: true, data: list, tagihanInfo: tagihan });
    } catch (error) { res.status(500).json({ message: "Error loading payments" }); }
};