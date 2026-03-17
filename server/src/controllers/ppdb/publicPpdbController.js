const prisma = require("../../config/prisma");
const path = require("path");
const fs = require("fs");

// ─── PUBLIC: SELF-REGISTER CALON SANTRI ──────────────────────────────

// 1. Cek gelombang yang sedang aktif (public)
exports.getGelombangAktif = async (req, res) => {
  try {
    const now = new Date();
    const gelombang = await prisma.ppdb_tahun.findMany({
      where: {
        is_active: true,
        tanggal_buka: { lte: now },
        tanggal_tutup: { gte: now },
      },
      select: {
        id: true,
        nama_gelombang: true,
        tahun_ajaran: true,
        gelombang: true,
        tanggal_buka: true,
        tanggal_tutup: true,
        tanggal_pengumuman: true,
        kuota: true,
        biaya_pendaftaran: true,
        deskripsi: true,
        _count: { select: { ppdb_pendaftar: true } },
      },
      orderBy: { gelombang: "asc" },
    });

    const result = gelombang.map((g) => ({
      ...g,
      total_pendaftar: g._count.ppdb_pendaftar,
      sisa_kuota: g.kuota ? g.kuota - g._count.ppdb_pendaftar : null,
      _count: undefined,
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error getGelombangAktif:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// 2. Submit formulir pendaftaran (self-register)
exports.submitPendaftaran = async (req, res) => {
  const {
    id_tahun, nama_lengkap, jenis_kelamin,
    tempat_lahir, tanggal_lahir, anak_ke, jumlah_saudara,
    alamat, no_hp, email,
    asal_sekolah, jurusan_asal, tahun_lulus, nilai_rata_rapor,
    kemampuan_quran, juz_hafalan,
    orangtua,
  } = req.body;

  try {
    const tahun = await prisma.ppdb_tahun.findFirst({
      where: { id: parseInt(id_tahun), is_active: true },
    });

    if (!tahun) return res.status(404).json({ success: false, message: "Gelombang PPDB tidak ditemukan atau sudah tutup" });

    const now = new Date();
    if (now < tahun.tanggal_buka || now > tahun.tanggal_tutup) {
      return res.status(400).json({ success: false, message: "Pendaftaran untuk gelombang ini belum/sudah ditutup" });
    }

    // Cek kuota
    if (tahun.kuota) {
      const totalDaftar = await prisma.ppdb_pendaftar.count({
        where: { id_tahun: parseInt(id_tahun), is_active: true },
      });
      if (totalDaftar >= tahun.kuota) {
        return res.status(400).json({ success: false, message: "Kuota pendaftar untuk gelombang ini sudah penuh" });
      }
    }

    // Cek duplikasi via email/no_hp
    if (email) {
      const existing = await prisma.ppdb_pendaftar.findFirst({
        where: { email, id_tahun: parseInt(id_tahun), is_active: true },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email ini sudah terdaftar pada gelombang yang sama" });
      }
    }

    // Generate nomor pendaftaran
    const count = await prisma.ppdb_pendaftar.count({ where: { id_tahun: parseInt(id_tahun) } });
    const no_pendaftaran = `PPDB-${tahun.tahun_ajaran.replace("/", "")}-G${tahun.gelombang}-${String(count + 1).padStart(4, "0")}`;

    // Insert Pendaftar (Menggunakan connect untuk id_tahun)
    const newPendaftar = await prisma.ppdb_pendaftar.create({
      data: {
        ppdb_tahun: { connect: { id: parseInt(id_tahun) } }, // PERBAIKAN 1
        nama_lengkap, 
        jenis_kelamin: jenis_kelamin === "Laki-laki" ? "Laki_laki" : "Perempuan",
        tempat_lahir,
        tanggal_lahir: new Date(tanggal_lahir),
        anak_ke: anak_ke ? parseInt(anak_ke) : null,
        jumlah_saudara: jumlah_saudara ? parseInt(jumlah_saudara) : null,
        alamat, 
        no_hp, 
        email,
        asal_sekolah, 
        jurusan_asal, 
        tahun_lulus,
        nilai_rata_rapor: nilai_rata_rapor ? parseFloat(nilai_rata_rapor) : null,
        kemampuan_quran: kemampuan_quran || null,
        juz_hafalan: juz_hafalan ? parseInt(juz_hafalan) : 0,
        no_pendaftaran,
        status: "Mendaftar",
      },
    });

    // Simpan orangtua (Menggunakan connect untuk id_pendaftar)
    const orangtuaData = typeof orangtua === "string" ? JSON.parse(orangtua) : orangtua;
    if (orangtuaData && Array.isArray(orangtuaData)) {
      for (const ortu of orangtuaData) {
        await prisma.ppdb_orangtua.create({
          data: {
            ppdb_pendaftar: { connect: { id: newPendaftar.id } }, // PERBAIKAN 2
            hubungan: ortu.hubungan,
            nama: ortu.nama,
            tempat_lahir: ortu.tempat_lahir || null,
            tanggal_lahir: ortu.tanggal_lahir ? new Date(ortu.tanggal_lahir) : null,
            pendidikan: ortu.pendidikan || null,
            pekerjaan: ortu.pekerjaan || null,
            penghasilan: ortu.penghasilan || null,
            no_hp: ortu.no_hp || null,
            alamat: ortu.alamat || null,
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Pendaftaran berhasil! Simpan nomor pendaftaran Anda: ${no_pendaftaran}`,
      data: {
        id: newPendaftar.id,
        no_pendaftaran,
        nama_lengkap,
        status: "Mendaftar",
      },
    });
  } catch (error) {
    console.error("Error submitPendaftaran:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat mendaftar" });
  }
};

// 3. Upload dokumen (by no_pendaftaran)
exports.uploadDokumen = async (req, res) => {
  const { no_pendaftaran } = req.params;
  const { jenis_dokumen } = req.body;

  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { no_pendaftaran, is_active: true },
    });

    if (!pendaftar) return res.status(404).json({ success: false, message: "Nomor pendaftaran tidak ditemukan" });
    if (!req.file) return res.status(400).json({ success: false, message: "File tidak ditemukan" });

    // Cek apakah sudah pernah upload jenis dokumen yang sama
    const existingDoc = await prisma.ppdb_dokumen.findFirst({
      where: { id_pendaftar: pendaftar.id, jenis_dokumen, is_active: true },
    });

    if (existingDoc) {
      // Hapus file lama (Path disesuaikan dengan struktur folder public/uploads/ppdb/dokumen)
      const oldPath = path.join(process.cwd(), "public/uploads/ppdb/dokumen", existingDoc.path_file);
      if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error("Gagal hapus file lama:", e); }
      }
      
      // Update data dokumen di DB
      await prisma.ppdb_dokumen.update({
        where: { id: existingDoc.id },
        data: {
          nama_file: req.file.originalname,
          path_file: req.file.filename, // Nama file dari Multer Middleware
          status_verif: "Belum_Diverifikasi",
          catatan: null,
        },
      });
    } else {
      // Buat baru (Menggunakan connect)
      await prisma.ppdb_dokumen.create({
        data: {
          ppdb_pendaftar: { connect: { id: pendaftar.id } }, // PERBAIKAN 3
          jenis_dokumen,
          nama_file: req.file.originalname,
          path_file: req.file.filename,
          status_verif: "Belum_Diverifikasi",
        },
      });
    }

    return res.json({ success: true, message: "Dokumen berhasil diupload" });
  } catch (error) {
    console.error("Error uploadDokumen:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat upload" });
  }
};

// 4. Cek status pendaftaran by nomor pendaftaran (public)
exports.cekStatusPendaftaran = async (req, res) => {
  const { no_pendaftaran } = req.params;
  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { no_pendaftaran, is_active: true },
      select: {
        id: true,
        no_pendaftaran: true,
        nama_lengkap: true,
        status: true,
        catatan_panitia: true,
        ppdb_tahun: { 
          select: { 
            nama_gelombang: true, 
            tanggal_seleksi: true, 
            tanggal_pengumuman: true, 
            tahun_ajaran: true 
          } 
        },
        ppdb_dokumen: {
          where: { is_active: true },
          select: { jenis_dokumen: true, status_verif: true, catatan: true },
        },
        ppdb_seleksi: {
          select: {
            nilai_quran: true,
            nilai_tulis: true,
            nilai_wawancara: true,
            nilai_total: true,
            rekomendasi: true,
            status_seleksi: true,
            tanggal_seleksi: true,
          },
        },
      },
    });

    if (!pendaftar) return res.status(404).json({ success: false, message: "Nomor pendaftaran tidak ditemukan" });

    return res.json({ success: true, data: pendaftar });
  } catch (error) {
    console.error("Error cekStatusPendaftaran:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat cek status" });
  }
};

// 5. Lupa Nomor Pendaftaran (Recovery)
exports.lupaNomorPendaftaran = async (req, res) => {
  const { no_hp, tanggal_lahir } = req.body;
  try {
    if (!no_hp || !tanggal_lahir) {
      return res.status(400).json({ success: false, message: "No. HP dan Tanggal Lahir wajib diisi" });
    }

    // Cari pendaftar berdasarkan Tgl Lahir DAN (No HP Santri ATAU No HP Wali)
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: {
        tanggal_lahir: new Date(tanggal_lahir),
        is_active: true,
        OR: [
          { no_hp: no_hp },
          { ppdb_orangtua: { some: { no_hp: no_hp } } }
        ]
      },
      select: { 
        no_pendaftaran: true, 
        nama_lengkap: true 
      }
    });

    if (!pendaftar) {
      return res.status(404).json({ 
        success: false, 
        message: "Data tidak ditemukan. Pastikan No. HP dan Tanggal Lahir sesuai dengan form pendaftaran." 
      });
    }

    return res.json({ success: true, data: pendaftar });
  } catch (error) {
    console.error("Error lupaNomorPendaftaran:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};