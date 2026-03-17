const prisma = require("../../config/prisma");

// ─── SELEKSI ─────────────────────────────────────────────────────────

exports.getAllPendaftarSeleksi = async (req, res) => {
  const { id_tahun, status_seleksi, search } = req.query;
  
  try {
    // 1. Kondisi Dasar: Tetap tarik yang Lulus/Ditolak agar summary Total Peserta tidak berkurang
    const where = {
      is_active: true,
      status: { in: ["Seleksi", "Lulus", "Ditolak"] },
      AND: [] // Gunakan AND array untuk menggabungkan beberapa OR
    };

    if (id_tahun) {
      where.id_tahun = parseInt(id_tahun);
    }

    // 2. Filter Pencarian Nama/No Pendaftaran
    if (search) {
      where.AND.push({
        OR: [
          { nama_lengkap: { contains: search } },
          { no_pendaftaran: { contains: search } },
        ]
      });
    }

    // 3. Filter Status Seleksi (Logika Relasi Prisma)
    if (status_seleksi) {
      if (status_seleksi === "Belum_Diseleksi") {
        // Jika belum diseleksi: Bisa jadi record seleksinya BELUM ADA (none) 
        // atau SUDAH ADA tapi statusnya "Belum_Diseleksi"
        where.AND.push({
          OR: [
            { ppdb_seleksi: { none: {} } },
            { ppdb_seleksi: { some: { status_seleksi: "Belum_Diseleksi" } } }
          ]
        });
      } else {
        // Untuk "Sedang_Diseleksi" atau "Selesai"
        where.ppdb_seleksi = { some: { status_seleksi: status_seleksi } };
      }
    }

    // Bersihkan array AND jika kosong agar tidak error
    if (where.AND.length === 0) delete where.AND;

    // 4. Eksekusi Query
    const pendaftar = await prisma.ppdb_pendaftar.findMany({
      where,
      include: {
        ppdb_tahun: { select: { nama_gelombang: true, tahun_ajaran: true } },
        // Ambil hasil seleksi terbaru saja jika ada lebih dari 1
        ppdb_seleksi: {
          take: 1 
        },
      },
    });

    // 5. PERBAIKAN KRUSIAL: Flatten array ppdb_seleksi menjadi 1 objek
    // Agar p.ppdb_seleksi?.status_seleksi di frontend bisa terbaca
    const formattedData = pendaftar.map(p => ({
      ...p,
      ppdb_seleksi: p.ppdb_seleksi && p.ppdb_seleksi.length > 0 ? p.ppdb_seleksi[0] : null
    }));

    return res.json({ 
      success: true, 
      data: formattedData 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.getDetailSeleksi = async (req, res) => {
  const { id_pendaftar } = req.params;
  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { id: parseInt(id_pendaftar), is_active: true },
      include: {
        ppdb_tahun: true,
        ppdb_orangtua: { where: { is_active: true } },
        ppdb_dokumen: { where: { is_active: true } },
        ppdb_seleksi: {
          take: 1
        },
      },
    });

    if (!pendaftar) return res.status(404).json({ success: false, message: "Data pendaftar tidak ditemukan" });

    // Format agar ppdb_seleksi menjadi objek, bukan array
    const formattedPendaftar = {
      ...pendaftar,
      ppdb_seleksi: pendaftar.ppdb_seleksi && pendaftar.ppdb_seleksi.length > 0 ? pendaftar.ppdb_seleksi[0] : null
    };

    return res.json({ success: true, data: formattedPendaftar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.simpanHasilSeleksi = async (req, res) => {
  const { id_pendaftar } = req.params;
  const {
    nilai_quran, catatan_quran, juz_diuji,
    nilai_tulis, catatan_tulis,
    nilai_wawancara, catatan_wawancara,
    tanggal_seleksi, rekomendasi,
  } = req.body;

  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { id: parseInt(id_pendaftar), is_active: true },
    });
    if (!pendaftar) return res.status(404).json({ success: false, message: "Pendaftar tidak ditemukan" });

    // Hitung nilai total (rata-rata tertimbang: quran 40%, tulis 35%, wawancara 25%)
    const nq = nilai_quran ? parseFloat(nilai_quran) : 0;
    const nt = nilai_tulis ? parseFloat(nilai_tulis) : 0;
    const nw = nilai_wawancara ? parseFloat(nilai_wawancara) : 0;
    const nilai_total = parseFloat((nq * 0.4 + nt * 0.35 + nw * 0.25).toFixed(2));

    const existingSeleksi = await prisma.ppdb_seleksi.findFirst({
      where: { id_pendaftar: parseInt(id_pendaftar) },
    });

    let seleksi;
    if (existingSeleksi) {
      seleksi = await prisma.ppdb_seleksi.update({
        where: { id: existingSeleksi.id },
        data: {
          id_penilai: req.user.id,
          nilai_quran: nq,
          catatan_quran,
          juz_diuji: juz_diuji ? parseInt(juz_diuji) : null,
          nilai_tulis: nt,
          catatan_tulis,
          nilai_wawancara: nw,
          catatan_wawancara,
          nilai_total,
          tanggal_seleksi: tanggal_seleksi ? new Date(tanggal_seleksi) : new Date(),
          status_seleksi: "Selesai",
          rekomendasi: rekomendasi || null,
        },
      });
    } else {
      seleksi = await prisma.ppdb_seleksi.create({
        data: {
          id_pendaftar: parseInt(id_pendaftar),
          id_penilai: req.user.id,
          nilai_quran: nq,
          catatan_quran,
          juz_diuji: juz_diuji ? parseInt(juz_diuji) : null,
          nilai_tulis: nt,
          catatan_tulis,
          nilai_wawancara: nw,
          catatan_wawancara,
          nilai_total,
          tanggal_seleksi: tanggal_seleksi ? new Date(tanggal_seleksi) : new Date(),
          status_seleksi: "Selesai",
          rekomendasi: rekomendasi || null,
        },
      });
    }

    // Update status pendaftar berdasarkan rekomendasi (Lulus/Ditolak tetap terhitung di query awal)
    let newStatus = pendaftar.status;
    if (rekomendasi === "Diterima") newStatus = "Lulus";
    else if (rekomendasi === "Ditolak") newStatus = "Ditolak";

    if (newStatus !== pendaftar.status) {
      await prisma.ppdb_pendaftar.update({
        where: { id: parseInt(id_pendaftar) },
        data: { status: newStatus },
      });
    }

    return res.json({
      success: true,
      message: "Hasil seleksi berhasil disimpan",
      data: { ...seleksi, status_pendaftar: newStatus },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Bulk publish pengumuman hasil seleksi
exports.publishPengumuman = async (req, res) => {
  const { id_tahun } = req.params;
  try {
    const tahun = await prisma.ppdb_tahun.findFirst({ where: { id: parseInt(id_tahun), is_active: true } });
    if (!tahun) return res.status(404).json({ success: false, message: "Gelombang PPDB tidak ditemukan" });

    if (!tahun.tanggal_pengumuman) {
      await prisma.ppdb_tahun.update({
        where: { id: parseInt(id_tahun) },
        data: { tanggal_pengumuman: new Date() },
      });
    }

    const seleksiSelesai = await prisma.ppdb_seleksi.findMany({
      where: {
        status_seleksi: "Selesai",
        ppdb_pendaftar: { id_tahun: parseInt(id_tahun), status: "Seleksi" },
      },
      include: { ppdb_pendaftar: true },
    });

    for (const s of seleksiSelesai) {
      const newStatus = s.rekomendasi === "Diterima" ? "Lulus" : s.rekomendasi === "Ditolak" ? "Ditolak" : "Seleksi";
      if (newStatus !== s.ppdb_pendaftar.status) {
        await prisma.ppdb_pendaftar.update({
          where: { id: s.id_pendaftar },
          data: { status: newStatus },
        });
      }
    }

    return res.json({ success: true, message: "Pengumuman PPDB berhasil dipublikasikan" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// ─── REKAPITULASI SELEKSI ─────────────────────────────────────────────

exports.getRekap = async (req, res) => {
  const { id_tahun } = req.params;
  try {
    const pendaftar = await prisma.ppdb_pendaftar.findMany({
      where: { id_tahun: parseInt(id_tahun), is_active: true, status: { in: ["Seleksi", "Lulus", "Ditolak"] } },
      include: {
        ppdb_seleksi: {
          take: 1
        },
      },
    });

    // Urutkan manual berdasarkan nilai_total dari yang terbesar
    const rekap = pendaftar.map((p) => {
      const s = p.ppdb_seleksi && p.ppdb_seleksi.length > 0 ? p.ppdb_seleksi[0] : null;
      return {
        id: p.id,
        no_pendaftaran: p.no_pendaftaran,
        nama_lengkap: p.nama_lengkap,
        jenis_kelamin: p.jenis_kelamin,
        asal_sekolah: p.asal_sekolah,
        nilai_quran: s?.nilai_quran ?? null,
        nilai_tulis: s?.nilai_tulis ?? null,
        nilai_wawancara: s?.nilai_wawancara ?? null,
        nilai_total: s?.nilai_total ?? null,
        rekomendasi: s?.rekomendasi ?? null,
        status: p.status,
      };
    }).sort((a, b) => (b.nilai_total || 0) - (a.nilai_total || 0));

    return res.json({ success: true, data: rekap });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};