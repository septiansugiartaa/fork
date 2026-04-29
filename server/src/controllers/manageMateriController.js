const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const moment = require('moment');

exports.getViewMateri = async (req, res) => {
    try {
        const materiList = await prisma.materi.findMany({
            where: { is_active: true },
            select: {
                id_materi:      true,
                gambar:         true,
                judul_materi:   true,
                ringkasan:      true,
                detail_materi:  true,
                penulis:        true,
                sumber:         true,
                tanggal_dibuat: true,
            },
            orderBy: { id_materi: 'desc' }
        });

        const formattedData = materiList.map(item => ({
            id:             item.id_materi,
            gambar:         item.gambar,
            judul:          item.judul_materi,
            ringkasan:      item.ringkasan,
            penulis:        item.penulis || 'Admin',
            isi_materi:     item.detail_materi[0]?.isi_materi || '',
            sumber:         item.sumber || 'teori',
            tanggal_dibuat: item.tanggal_dibuat,
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: { total_materi: formattedData.length },
                list_materi: formattedData
            }
        });
    } catch (error) {
        console.error('Error Get Materi:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data materi' });
    }
};

exports.postManageMateri = async (req, res) => {
  try {
    const judul_materi = req.body?.judul_materi;
    const ringkasan    = req.body?.ringkasan;
    const penulis      = req.body?.penulis;
    const isi_materi   = req.body?.isi_materi;
    const gambar       = req.file ? req.file.filename : null;

    const newMateri = await prisma.materi.create({
      data: {
        judul_materi,
        ringkasan,
        penulis,
        tanggal_dibuat: new Date(),
        gambar,
        sumber:    'teori',
        is_active: true
      }
    });

    if (isi_materi) {
      await prisma.detail_materi.create({
        data: {
          id_materi:  newMateri.id_materi,
          isi_materi: isi_materi,
          is_active:  true
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Materi berhasil dibuat',
      data: newMateri
    });

  } catch (error) {
    console.error('ERROR CREATE MATERI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.putManageMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul_materi, ringkasan, penulis, isi_materi } = req.body;

    const existingMateri = await prisma.materi.findUnique({
      where: { id_materi: Number(id) },
      include: { detail_materi: true }
    });

    if (!existingMateri) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
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

    if (existingMateri.detail_materi.length > 0) {
      await prisma.detail_materi.update({
        where: { id_detail_materi: existingMateri.detail_materi[0].id_detail_materi },
        data: { isi_materi }
      });
    } else {
      await prisma.detail_materi.create({
        data: { id_materi: Number(id), isi_materi, is_active: true }
      });
    }

    res.status(200).json({ success: true, message: 'Materi berhasil diupdate', data: updatedMateri });

  } catch (error) {
    console.error('ERROR UPDATE MATERI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteManageMateri = async (req, res) => {
    try {
        const { id } = req.params;

        const existingMateri = await prisma.materi.findUnique({
            where: { id_materi: Number(id) }
        });

        if (!existingMateri) {
            return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
        }

        await prisma.materi.update({
            where: { id_materi: Number(id) },
            data: { is_active: false }
        });

        res.status(200).json({ success: true, message: 'Materi berhasil dihapus' });

    } catch (error) {
        console.error('ERROR DELETE MATERI:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDetailMateri = async (req, res) => {
  try {
    const { id } = req.params;

    const materi = await prisma.materi.findFirst({
      where: { id_materi: Number(id), is_active: true },
      include: { detail_materi: true }
    });

    if (!materi) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
    }

    res.status(200).json({ success: true, data: materi });

  } catch (error) {
    console.error('ERROR DETAIL MATERI:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKomentarMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentPage = 1, commentLimit = 5, replyLimit = 5 } = req.query;

    const page      = Number(commentPage);
    const limit     = Number(commentLimit);
    const takeReply = Number(replyLimit);
    const skip      = (page - 1) * limit;

    const [totalKomentar, komentar] = await prisma.$transaction([
      prisma.materi_comment.count({
        where: { id_materi: Number(id), is_active: true }
      }),
      prisma.materi_comment.findMany({
        where: { id_materi: Number(id), is_active: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true, nama: true, foto_profil: true,
              user_role: {
                where: { is_active: true },
                select: { role: { select: { role: true } } }
              }
            }
          },
          materi_comment_reply: {
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            take: takeReply,
            include: {
              users: {
                select: {
                  id: true, nama: true, foto_profil: true,
                  user_role: {
                    where: { is_active: true },
                    select: { role: { select: { role: true } } }
                  }
                }
              }
            }
          },
          _count: {
            select: { materi_comment_reply: { where: { is_active: true } } }
          }
        }
      })
    ]);

    const data = komentar.map((item) => ({
      id_comment:  item.id_comment,
      isi_comment: item.isi_comment,
      created_at:  item.created_at,
      user: {
        id:          item.users?.id,
        nama:        item.users?.nama,
        foto_profil: item.users?.foto_profil,
        role:        item.users?.user_role?.[0]?.role?.role || 'Pengguna'
      },
      replies: item.materi_comment_reply.map((reply) => ({
        id_reply:   reply.id_reply,
        isi_reply:  reply.isi_reply,
        created_at: reply.created_at,
        user: {
          id:          reply.users?.id,
          nama:        reply.users?.nama,
          foto_profil: reply.users?.foto_profil,
          role:        reply.users?.user_role?.[0]?.role?.role || 'Pengguna'
        }
      })),
      total_replies:    item._count.materi_comment_reply,
      has_more_replies: item._count.materi_comment_reply > takeReply
    }));

    res.json({
      success: true,
      data,
      pagination: { total: totalKomentar, page, limit, hasMore: skip + data.length < totalKomentar }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createKomentarMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const { isi_comment } = req.body;

    if (!isi_comment || !isi_comment.trim()) {
      return res.status(400).json({ success: false, message: 'Komentar wajib diisi' });
    }

    await prisma.materi_comment.create({
      data: {
        id_materi:   Number(id),
        id_user:     req.user.id,
        isi_comment: isi_comment.trim(),
        is_active:   true,
        created_at:  new Date()
      }
    });

    res.status(201).json({ success: true, message: 'Komentar berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReplyKomentar = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const currentPage = Number(page);
    const take        = Number(limit);
    const skip        = (currentPage - 1) * take;

    const [total, rows] = await prisma.$transaction([
      prisma.materi_comment_reply.count({
        where: { id_comment: Number(commentId), is_active: true }
      }),
      prisma.materi_comment_reply.findMany({
        where: { id_comment: Number(commentId), is_active: true },
        orderBy: { created_at: 'desc' },
        skip, take,
        include: {
          users: {
            select: {
              id: true, nama: true, foto_profil: true,
              user_role: {
                where: { is_active: true },
                select: { role: { select: { role: true } } }
              }
            }
          }
        }
      })
    ]);

    const data = rows.map((reply) => ({
      id_reply:   reply.id_reply,
      isi_reply:  reply.isi_reply,
      created_at: reply.created_at,
      user: {
        id:          reply.users?.id,
        nama:        reply.users?.nama,
        foto_profil: reply.users?.foto_profil,
        role:        reply.users?.user_role?.[0]?.role?.role || 'Pengguna'
      }
    }));

    res.json({
      success: true, data,
      pagination: { total, page: currentPage, limit: take, hasMore: skip + data.length < total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReplyKomentar = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isi_reply } = req.body;

    if (!isi_reply || !isi_reply.trim()) {
      return res.status(400).json({ success: false, message: 'Balasan wajib diisi' });
    }

    const komentar = await prisma.materi_comment.findUnique({
      where: { id_comment: Number(commentId) }
    });

    if (!komentar || !komentar.is_active) {
      return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });
    }

    await prisma.materi_comment_reply.create({
      data: {
        id_comment: Number(commentId),
        id_user:    req.user.id,
        isi_reply:  isi_reply.trim(),
        is_active:  true,
        created_at: new Date()
      }
    });

    res.status(201).json({ success: true, message: 'Balasan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};