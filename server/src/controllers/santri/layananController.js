const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. GET: Ambil Daftar Jenis Layanan
exports.getDaftarLayanan = async (req, res) => {
    try {
        const layanan = await prisma.jenis_layanan.findMany({
            where: { is_active: true }
        });
        res.json({ success: true, data: layanan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat layanan" });
    }
};

// 2. POST: Ajukan Layanan
exports.ajukanLayanan = async (req, res) => {
    const userId = req.user.id; // ID Santri
    const { id_layanan, form_data } = req.body; 
    // form_data format: [{ label: 'Alasan', value: 'Sakit' }, { label: 'Tujuan', value: 'RS' }]

    if (!id_layanan || !form_data) {
        return res.status(400).json({ message: "Data tidak lengkap" });
    }

    try {
        // Gunakan Transaction agar Header & Detail masuk bebarengan
        const result = await prisma.$transaction(async (tx) => {
            if (form_data.length > 0) {
                const detailData = form_data.map(item => ({
                    id_riwayat: riwayat.id,
                    aspek: item.label,  // Pertanyaan/Label Input
                    detail: item.value, // Jawaban User
                    is_active: true
                }));

                await tx.riwayat_layanan_detail.createMany({
                    data: detailData
                });
            }

            return riwayat;
        });

        res.json({ success: true, message: "Pengajuan berhasil dikirim", data: result });

    } catch (error) {
        console.error("Error pengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal mengirim pengajuan" });
    }
};