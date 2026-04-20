const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs   = require('fs');

function safeDeleteFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '../../../public/uploads', filename);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

// POST /api/public/pengajuanMateri — token opsional
exports.ajukanMateri = async (req, res) => {
  try {
    const { judul_materi, penulis, ringkasan, isi_materi } = req.body;
    const gambar = req.file ? req.file.filename : null;

    if (!judul_materi?.trim() || !penulis?.trim() || !ringkasan?.trim() || !isi_materi?.trim()) {
      if (gambar) safeDeleteFile(gambar);
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    const id_pengaju   = req.user?.id   || null;
    const nama_pengaju = id_pengaju ? null : (penulis?.trim() || 'Anonim');

    const pengajuan = await prisma.pengajuan_materi.create({
      data: {
        judul_materi: judul_materi.trim(),
        penulis:      penulis.trim(),
        ringkasan:    ringkasan.trim(),
        isi_materi:   isi_materi.trim(),
        gambar,
        id_pengaju,
        nama_pengaju,
        status: 'ditinjau',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan materi berhasil dikirim.',
      data: { id: pengajuan.id_pengajuan }
    });
  } catch (error) {
    console.error('ajukanMateri:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/global/riwayatPengajuanMateri — user yang login
exports.getRiwayatPengajuan = async (req, res) => {
  try {
    const id_pengaju = req.user?.id;
    if (!id_pengaju) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const list = await prisma.pengajuan_materi.findMany({
      where: { id_pengaju },
      select: {
        id_pengajuan:   true,
        judul_materi:   true,
        status:         true,
        catatan_timkes: true,
        created_at:     true,
      },
      orderBy: { created_at: 'desc' }
    });

    const formattedList = list.map(item => ({
      id:                item.id_pengajuan,
      judul:             item.judul_materi,
      status:            item.status,
      catatan_timkes:    item.catatan_timkes,
      tanggal_pengajuan: item.created_at,
    }));

    return res.json({
      success: true,
      data: { list_pengajuan: formattedList }
    });
  } catch (error) {
    console.error('getRiwayatPengajuan:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/timkesehatan/pengajuanMateri — timkes
exports.getSemuaPengajuan = async (req, res) => {
  try {
    const list = await prisma.pengajuan_materi.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id_pengajuan:    true,
        judul_materi:    true,
        penulis:         true,
        ringkasan:       true,
        isi_materi:      true,
        gambar:          true,
        status:          true,
        catatan_timkes:  true,
        id_pengaju:      true,
        nama_pengaju:    true,
        id_materi_hasil: true,
        created_at:      true,
        updated_at:      true,
      }
    });

    // Urutkan: ditinjau dulu, lalu disetujui, lalu ditolak
    const ORDER = { ditinjau: 0, disetujui: 1, ditolak: 2 };
    list.sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9));

    const formattedList = list.map(item => ({
      id:                item.id_pengajuan,
      judul:             item.judul_materi,
      penulis:           item.penulis,
      ringkasan:         item.ringkasan,
      isi_materi:        item.isi_materi,
      gambar:            item.gambar,
      status:            item.status,
      catatan_timkes:    item.catatan_timkes,
      id_pengaju:        item.id_pengaju,
      nama_pengaju:      item.nama_pengaju,
      id_materi_hasil:   item.id_materi_hasil,
      tanggal_pengajuan: item.created_at,
      tanggal_update:    item.updated_at,
    }));

    return res.json({
      success: true,
      data: { list_pengajuan: formattedList }
    });
  } catch (error) {
    console.error('getSemuaPengajuan:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/timkesehatan/pengajuanMateri/:id — timkes edit sebelum diproses
exports.editPengajuan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { judul_materi, penulis, ringkasan, isi_materi, catatan_timkes } = req.body;
    const gambar = req.file ? req.file.filename : undefined;

    const existing = await prisma.pengajuan_materi.findUnique({
      where: { id_pengajuan: id }
    });

    if (!existing) {
      if (gambar) safeDeleteFile(gambar);
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan.' });
    }

    const updateData = {};
    if (judul_materi?.trim())          updateData.judul_materi   = judul_materi.trim();
    if (penulis?.trim())               updateData.penulis        = penulis.trim();
    if (ringkasan?.trim())             updateData.ringkasan      = ringkasan.trim();
    if (isi_materi?.trim())            updateData.isi_materi     = isi_materi.trim();
    if (catatan_timkes !== undefined)   updateData.catatan_timkes = catatan_timkes || null;
    if (gambar)                         updateData.gambar         = gambar;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    await prisma.pengajuan_materi.update({
      where: { id_pengajuan: id },
      data: updateData
    });

    return res.json({ success: true, message: 'Pengajuan berhasil diperbarui.' });
  } catch (error) {
    console.error('editPengajuan:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/timkesehatan/pengajuanMateri/:id/setujui — timkes setujui
exports.setujuiPengajuan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { catatan_timkes } = req.body;
    const gambar = req.file ? req.file.filename : undefined;

    const pengajuan = await prisma.pengajuan_materi.findUnique({
      where: { id_pengajuan: id }
    });

    if (!pengajuan) {
      if (gambar) safeDeleteFile(gambar);
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan.' });
    }

    if (pengajuan.status !== 'ditinjau') {
      if (gambar) safeDeleteFile(gambar);
      return res.status(400).json({ success: false, message: 'Pengajuan sudah diproses sebelumnya.' });
    }

    const judul     = req.body.judul_materi?.trim() || pengajuan.judul_materi;
    const penulis   = req.body.penulis?.trim()      || pengajuan.penulis;
    const ringkasan = req.body.ringkasan?.trim()    || pengajuan.ringkasan;
    const isi       = req.body.isi_materi?.trim()   || pengajuan.isi_materi;
    const finalGambar = gambar || pengajuan.gambar;

    const result = await prisma.$transaction(async (tx) => {
      const newMateri = await tx.materi.create({
        data: {
          judul_materi:   judul,
          penulis:        penulis,
          ringkasan:      ringkasan,
          gambar:         finalGambar,
          sumber:         'pengalaman',
          is_active:      true,
          tanggal_dibuat: new Date(),
        }
      });

      await tx.detail_materi.create({
        data: {
          id_materi:  newMateri.id_materi,
          isi_materi: isi,
          is_active:  true,
        }
      });

      await tx.pengajuan_materi.update({
        where: { id_pengajuan: id },
        data: {
          status:          'disetujui',
          id_materi_hasil: newMateri.id_materi,
          catatan_timkes:  catatan_timkes?.trim() || null,
        }
      });

      return newMateri;
    });

    return res.json({
      success: true,
      message: 'Pengajuan disetujui dan materi berhasil diterbitkan.',
      data: { id_materi: result.id_materi }
    });
  } catch (error) {
    console.error('setujuiPengajuan:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/timkesehatan/pengajuanMateri/:id/tolak — timkes tolak
exports.tolakPengajuan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { catatan_timkes } = req.body;

    const pengajuan = await prisma.pengajuan_materi.findUnique({
      where: { id_pengajuan: id }
    });

    if (!pengajuan) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan.' });
    }

    if (pengajuan.status !== 'ditinjau') {
      return res.status(400).json({ success: false, message: 'Pengajuan sudah diproses sebelumnya.' });
    }

    await prisma.pengajuan_materi.update({
      where: { id_pengajuan: id },
      data: {
        status:         'ditolak',
        catatan_timkes: catatan_timkes?.trim() || null,
      }
    });

    return res.json({ success: true, message: 'Pengajuan berhasil ditolak.' });
  } catch (error) {
    console.error('tolakPengajuan:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};