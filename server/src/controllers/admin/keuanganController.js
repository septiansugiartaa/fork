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
            orderBy: { tanggal_tagihan: 'desc' }
        });
        res.json({ success: true, data: tagihan });
    } catch (error) { res.status(500).json({ message: "Gagal memuat data" }); }
};

// 2. GET: Options untuk Modal Create
exports.getOptions = async (req, res) => {
    try {
        const santri = await prisma.users.findMany({
            where: { is_active: true, user_role: { some: { id_role: 1 } } },
            select: { id: true, nama: true, nip: true },
            orderBy: { nama: 'asc' }
        });
        const jenis = await prisma.jenis_tagihan.findMany({ where: { is_active: true } });
        res.json({ santri, jenis_tagihan: jenis });
    } catch (error) { res.status(500).json({ message: "Error loading options" }); }
};

// 3. POST: Create Tagihan (Bulk Support)
exports.createTagihan = async (req, res) => {
    const { nama_tagihan, id_jenis_tagihan, nominal, tanggal_tagihan, batas_pembayaran, target_santri } = req.body;

    try {
        let targetIds = [];

        // Logic "Pilih Semua" atau "Manual Select"
        if (target_santri === 'all') {
            const allSantri = await prisma.users.findMany({
                where: { is_active: true, user_role: { some: { id_role: 1 } } },
                select: { id: true }
            });
            targetIds = allSantri.map(s => s.id);
        } else if (Array.isArray(target_santri)) {
            targetIds = target_santri;
        } else {
            return res.status(400).json({ message: "Target santri tidak valid" });
        }

        if (targetIds.length === 0) return res.status(400).json({ message: "Tidak ada santri terpilih" });

        // Gunakan Transaction untuk insert banyak
        await prisma.$transaction(async (tx) => {
            const dataToInsert = targetIds.map(santriId => ({
                id_santri: parseInt(santriId),
                id_jenis_tagihan: parseInt(id_jenis_tagihan),
                nama_tagihan,
                nominal: parseInt(nominal),
                tanggal_tagihan: new Date(tanggal_tagihan),
                batas_pembayaran: new Date(batas_pembayaran),
                status: 'Aktif',
                is_active: true
            }));

            await tx.tagihan.createMany({ data: dataToInsert });
        });

        res.json({ success: true, message: `Berhasil membuat tagihan untuk ${targetIds.length} santri` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal membuat tagihan" });
    }
};

// 4. PUT: Update Tagihan (Single)
exports.updateTagihan = async (req, res) => {
    const { id } = req.params;
    const { nama_tagihan, nominal, tanggal_tagihan, batas_pembayaran, id_jenis_tagihan } = req.body;
    try {
        await prisma.tagihan.update({
            where: { id: parseInt(id) },
            data: {
                nama_tagihan,
                id_jenis_tagihan: parseInt(id_jenis_tagihan),
                nominal: parseInt(nominal),
                tanggal_tagihan: new Date(tanggal_tagihan),
                batas_pembayaran: new Date(batas_pembayaran)
            }
        });
        res.json({ success: true, message: "Tagihan diperbarui" });
    } catch (error) { res.status(500).json({ message: "Gagal update" }); }
};

// 5. DELETE: Soft Delete Tagihan
exports.deleteTagihan = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.tagihan.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ success: true, message: "Tagihan dihapus" });
    } catch (error) { res.status(500).json({ message: "Gagal hapus" }); }
};

// 6. GET: List Pembayaran
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

// 7. PUT: Update Status Tagihan
exports.updateStatusTagihan = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await prisma.tagihan.update({
            where: { id: parseInt(id) },
            data: { status }
        });
        res.json({ success: true, message: "Status tagihan diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "Gagal update status tagihan" });
    }
};

// 8. PUT: Verifikasi Pembayaran
exports.verifyPembayaran = async (req, res) => {
    const { id } = req.params;
    const { status, nominal_baru } = req.body; 

    try {
        const updateData = { status };
        
        if (nominal_baru) {
            updateData.nominal = parseFloat(nominal_baru);
        }

        await prisma.pembayaran.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({ success: true, message: "Pembayaran berhasil diverifikasi" });
    } catch (error) {
        res.status(500).json({ message: "Gagal verifikasi pembayaran" });
    }
};