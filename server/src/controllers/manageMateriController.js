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

exports.postManageMateri = async (req, res) => {
  try {
    const judul_materi = req.body?.judul_materi;
    const ringkasan = req.body?.ringkasan;
    const penulis = req.body?.penulis;

    const gambar = req.file ? req.file.filename : null;

    const newMateri = await prisma.materi.create({
      data: {
        judul_materi,
        ringkasan,
        penulis,
        gambar,
        is_active: true
      }
    });

    res.status(201).json({
      success: true,
      message: "Materi berhasil dibuat",
      data: newMateri
    });

  } catch (error) {
    console.error("ERROR CREATE MATERI:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

    
exports.putManageMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul_materi, ringkasan, penulis } = req.body;

    const existingMateri = await prisma.materi.findUnique({
      where: { id_materi: Number(id) }
    });

    if (!existingMateri) {
      return res.status(404).json({
        success: false,
        message: "Materi tidak ditemukan"
      });
    }

    const updatedMateri = await prisma.materi.update({
      where: { id_materi: Number(id) },
      data: {
        judul_materi,
        ringkasan,
        penulis,
        gambar: req.file ? req.file.filename : existingMateri.gambar
      }
    });

    res.status(200).json({
      success: true,
      message: "Materi berhasil diupdate",
      data: updatedMateri
    });

  } catch (error) {
    console.error("ERROR UPDATE MATERI:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteManageMateri = async (req, res) => {
    try {
        const { id } = req.params;

        const existingMateri = await prisma.materi.findUnique({
            where: { id_materi: Number(id) }
        });

        if (!existingMateri) {
            return res.status(404).json({
                success: false,
                message: "Materi tidak ditemukan"
            });
        }

        await prisma.materi.update({
            where: { id_materi: Number(id) },
            data: { is_active: false }
        });

        res.status(200).json({
            success: true,
            message: "Materi berhasil dihapus"
        });

    } catch (error) {
        console.error("ERROR DELETE MATERI:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};