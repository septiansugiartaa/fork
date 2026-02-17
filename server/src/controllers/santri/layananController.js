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

// 2. GET: Context Santri (Kamar & Kelas Aktif)
exports.getUserContext = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Cari data kamar & kelas aktif
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: {
                kelas_santri: {
                    where: { is_active: true },
                    take: 1,
                    include: { kelas: true }
                },
                kamar_santri: {
                    where: { is_active: true },
                    take: 1,
                    include: { kamar: true }
                }
            }
        });

        const data = {
            kelas: user.kelas_santri[0]?.kelas?.kelas || null,
            kamar: user.kamar_santri[0]?.kamar?.kamar || null
        };

        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memuat context" });
    }
};

// 3. POST: Ajukan Layanan (Logic Transaction Diperbaiki)
exports.ajukanLayanan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_layanan, form_data } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const riwayat = await tx.riwayat_layanan.create({
                data: {
                    id_santri: userId, // Pastikan userId integer
                    id_layanan: parseInt(id_layanan), // Pastikan jadi integer
                    waktu: new Date(),
                    status_sebelum: 'Proses',
                    status_sesudah: 'Proses'
                }
            });

            if (form_data.length > 0) {
                const detailData = form_data.map(item => ({
                    id_riwayat: riwayat.id,
                    aspek: String(item.label || "-"), // Paksa jadi String
                    detail: String(item.value || "-"), // Paksa jadi String (aman dari null/date obj)
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
        res.status(500).json({ success: false, message: "Gagal mengirim pengajuan", error_detail: error.message });
    }
};