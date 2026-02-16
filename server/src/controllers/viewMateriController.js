const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment');

exports.getViewMateri = async (req, res) => {
    try {
        const materiList = await prisma.materi.findMany({
            where: { is_active: true },
            select: {
                id_materi: true,
                gambar: true,
                judul_materi: true,
                ringkasan: true,
                penulis: true,
            },
            orderBy: { id_materi: 'desc' }
        });

        // Format data untuk frontend
        const formattedData = materiList.map(item => ({
            id: item.id_materi,
            gambar: item.gambar,
            judul: item.judul_materi,
            ringkasan: item.ringkasan,
            penulis: item.penulis || "Admin",
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    total_materi: formattedData.length,
                },
                list_materi: formattedData
            }
        });
    } catch (error) {
        console.error("Error Get Materi:", error);
        res.status(500).json({ success: false, message: "Gagal memuat data materi" });
    }
};