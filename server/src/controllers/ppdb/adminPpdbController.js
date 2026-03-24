const prisma = require("../../config/prisma");

// ─── PPDB TAHUN / GELOMBANG ───────────────────────────────────────────

exports.getAllTahun = async (req, res) => {
  try {
    const tahunList = await prisma.ppdb_tahun.findMany({
      where: { is_active: true },
      include: {
        _count: {
          select: { ppdb_pendaftar: true },
        },
      },
      orderBy: [{ tahun_ajaran: "desc" }, { gelombang: "asc" }],
    });

    const result = tahunList.map((t) => ({
      ...t,
      total_pendaftar: t._count.ppdb_pendaftar,
      _count: undefined,
    }));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.getTahunById = async (req, res) => {
  const { id } = req.params;
  try {
    const tahun = await prisma.ppdb_tahun.findFirst({
      where: { id: parseInt(id), is_active: true },
      include: {
        _count: {
          select: { ppdb_pendaftar: true },
        },
      },
    });

    if (!tahun) return res.status(404).json({ success: false, message: "Data gelombang tidak ditemukan" });

    return res.json({ success: true, data: { ...tahun, total_pendaftar: tahun._count.ppdb_pendaftar } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.createTahun = async (req, res) => {
  const {
    nama_gelombang, tahun_ajaran, gelombang,
    tanggal_buka, tanggal_tutup, tanggal_pengumuman,
    kuota, biaya_pendaftaran, deskripsi,
  } = req.body;

  try {
    const newTahun = await prisma.ppdb_tahun.create({
      data: {
        nama_gelombang,
        tahun_ajaran,
        gelombang: parseInt(gelombang) || 1,
        tanggal_buka: new Date(tanggal_buka),
        tanggal_tutup: new Date(tanggal_tutup),
        tanggal_pengumuman: tanggal_pengumuman ? new Date(tanggal_pengumuman) : null,
        kuota: kuota ? parseInt(kuota) : null,
        biaya_pendaftaran: biaya_pendaftaran ? parseInt(biaya_pendaftaran) : 0,
        deskripsi,
      },
    });

    await logActivity(req.user.id, req.user.role, "CREATE", "ppdb_tahun", newTahun.id, `Membuat gelombang PPDB: ${nama_gelombang}`);

    return res.status(201).json({ success: true, message: "Gelombang PPDB berhasil dibuat", data: newTahun });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.updateTahun = async (req, res) => {
  const { id } = req.params;
  const {
    nama_gelombang, tahun_ajaran, gelombang,
    tanggal_buka, tanggal_tutup, tanggal_pengumuman,
    kuota, biaya_pendaftaran, deskripsi,
  } = req.body;

  try {
    const existing = await prisma.ppdb_tahun.findFirst({ where: { id: parseInt(id), is_active: true } });
    if (!existing) return res.status(404).json({ success: false, message: "Data gelombang tidak ditemukan" });

    const updated = await prisma.ppdb_tahun.update({
      where: { id: parseInt(id) },
      data: {
        nama_gelombang,
        tahun_ajaran,
        gelombang: parseInt(gelombang) || 1,
        tanggal_buka: new Date(tanggal_buka),
        tanggal_tutup: new Date(tanggal_tutup),
        tanggal_pengumuman: tanggal_pengumuman ? new Date(tanggal_pengumuman) : null,
        kuota: kuota ? parseInt(kuota) : null,
        biaya_pendaftaran: biaya_pendaftaran ? parseInt(biaya_pendaftaran) : 0,
        deskripsi,
      },
    });

    await logActivity(req.user.id, req.user.role, "UPDATE", "ppdb_tahun", updated.id, `Mengubah gelombang PPDB: ${nama_gelombang}`);

    return res.json({ success: true, message: "Gelombang PPDB berhasil diperbarui", data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.deleteTahun = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.ppdb_tahun.findFirst({ where: { id: parseInt(id), is_active: true } });
    if (!existing) return res.status(404).json({ success: false, message: "Data gelombang tidak ditemukan" });

    await prisma.ppdb_tahun.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });

    await logActivity(req.user.id, req.user.role, "DELETE", "ppdb_tahun", parseInt(id), `Menghapus gelombang PPDB: ${existing.nama_gelombang}`);

    return res.json({ success: true, message: "Gelombang PPDB berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// ─── PENDAFTAR (admin view) ───────────────────────────────────────────

exports.getAllPendaftar = async (req, res) => {
  const { id_tahun, status, search } = req.query;
  try {
    const where = { is_active: true };
    if (id_tahun) where.id_tahun = parseInt(id_tahun);
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search } },
        { no_pendaftaran: { contains: search } },
        { asal_sekolah: { contains: search } },
      ];
    }

    const pendaftar = await prisma.ppdb_pendaftar.findMany({
      where,
      include: {
        ppdb_tahun: { select: { nama_gelombang: true, tahun_ajaran: true } },
        ppdb_dokumen: { select: { jenis_dokumen: true, status_verif: true } },
        ppdb_seleksi: { select: { nilai_total: true, status_seleksi: true, rekomendasi: true } },
      }
    });

    return res.json({ success: true, data: pendaftar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.getPendaftarById = async (req, res) => {
  const { id } = req.params;
  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { id: parseInt(id), is_active: true },
      include: {
        ppdb_tahun: true,
        ppdb_orangtua: { where: { is_active: true } },
        ppdb_dokumen: { where: { is_active: true } },
        ppdb_seleksi: true,
        ppdb_pembayaran_ref: true,
        users: { select: { id: true, nama: true, email: true } },
      },
    });

    if (!pendaftar) return res.status(404).json({ success: false, message: "Data pendaftar tidak ditemukan" });

    return res.json({ success: true, data: pendaftar });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

exports.updateStatusPendaftar = async (req, res) => {
  const { id } = req.params;
  const { status, catatan_panitia } = req.body;
  try {
    const existing = await prisma.ppdb_pendaftar.findFirst({ where: { id: parseInt(id), is_active: true } });
    if (!existing) return res.status(404).json({ success: false, message: "Data pendaftar tidak ditemukan" });

    const updated = await prisma.ppdb_pendaftar.update({
      where: { id: parseInt(id) },
      data: { status, catatan_panitia },
    });

    return res.json({ success: true, message: "Status pendaftar berhasil diperbarui", data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Konversi pendaftar yang diterima menjadi user aktif (santri)
exports.aktivasiSantri = async (req, res) => {
  const { id } = req.params;
  try {
    const pendaftar = await prisma.ppdb_pendaftar.findFirst({
      where: { id: parseInt(id), is_active: true, status: "Diterima" },
      include: { ppdb_orangtua: { where: { is_active: true } } },
    });

    if (!pendaftar) {
      return res.status(404).json({ success: false, message: "Pendaftar tidak ditemukan atau belum berstatus Diterima" });
    }
    if (pendaftar.id_user_aktif) {
      return res.status(400).json({ success: false, message: "Pendaftar ini sudah diaktivasi sebagai santri" });
    }

    // Cari role santri
    const roleSantri = await prisma.role.findFirst({ where: { role: "santri" } });
    if (!roleSantri) return res.status(500).json({ success: false, message: "Role santri tidak ditemukan di database" });

    // Generate NIS
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.users.count();
    const nis = `S${year}${String(count + 1).padStart(4, "0")}`;

    // Buat user baru
    const newUser = await prisma.users.create({
      data: {
        nip: nis,
        nama: pendaftar.nama_lengkap,
        jenis_kelamin: pendaftar.jenis_kelamin === "Laki-laki" ? "Laki_laki" : "Perempuan",
        tempat_lahir: pendaftar.tempat_lahir,
        tanggal_lahir: pendaftar.tanggal_lahir,
        email: pendaftar.email,
        no_hp: pendaftar.no_hp,
        alamat: pendaftar.alamat,
        is_active: true,
      },
    });

    // Assign role santri
    await prisma.user_role.create({
      data: { id_user: newUser.id, id_role: roleSantri.id },
    });

    // Buat relasi orangtua jika ada
    for (const ortu of pendaftar.ppdb_orangtua) {
      if (ortu.no_hp || ortu.nama) {
        let userOrtu = await prisma.users.findFirst({ where: { no_hp: ortu.no_hp, is_active: true } });
        if (!userOrtu) {
          const roleOrtu = await prisma.role.findFirst({ where: { role: "orangtua" } });
          userOrtu = await prisma.users.create({
            data: {
              nama: ortu.nama,
              no_hp: ortu.no_hp,
              alamat: ortu.alamat,
              is_active: true,
            },
          });
          if (roleOrtu) {
            await prisma.user_role.create({ data: { id_user: userOrtu.id, id_role: roleOrtu.id } });
          }
        }
        await prisma.orangtua.create({
          data: {
            id_orangtua: userOrtu.id,
            id_santri: newUser.id,
            hubungan: ortu.hubungan,
            is_active: true,
          },
        });
      }
    }

    // Link user aktif ke pendaftar
    await prisma.ppdb_pendaftar.update({
      where: { id: parseInt(id) },
      data: { id_user_aktif: newUser.id },
    });

    await logActivity(req.user.id, req.user.role, "CREATE", "users", newUser.id, `Aktivasi santri baru dari PPDB: ${pendaftar.nama_lengkap} (${nis})`);

    return res.status(201).json({
      success: true,
      message: `Santri ${pendaftar.nama_lengkap} berhasil diaktivasi dengan NIS ${nis}`,
      data: { id_user: newUser.id, nis },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Verifikasi dokumen pendaftar
exports.verifikasiDokumen = async (req, res) => {
  const { id_dokumen } = req.params;
  const { status_verif, catatan } = req.body;
  try {
    const dokumen = await prisma.ppdb_dokumen.findFirst({ where: { id: parseInt(id_dokumen), is_active: true } });
    if (!dokumen) return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan" });

    const updated = await prisma.ppdb_dokumen.update({
      where: { id: parseInt(id_dokumen) },
      data: { status_verif, catatan },
    });

    return res.json({ success: true, message: "Status dokumen berhasil diperbarui", data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Dashboard statistik PPDB
exports.getDashboardStats = async (req, res) => {
  const { id_tahun } = req.query;
  try {
    const where = { is_active: true };
    if (id_tahun) where.id_tahun = parseInt(id_tahun);

    const [
      totalPendaftar,
      perStatus,
      tahunAktif,
    ] = await Promise.all([
      prisma.ppdb_pendaftar.count({ where }),
      prisma.ppdb_pendaftar.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      prisma.ppdb_tahun.findMany({
        where: { is_active: true },
        take: 5,
      }),
    ]);

    const statusMap = {};
    perStatus.forEach((s) => { statusMap[s.status] = s._count.status; });

    return res.json({
      success: true,
      data: {
        total_pendaftar: totalPendaftar,
        per_status: statusMap,
        tahun_list: tahunAktif,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Input pendaftar manual oleh admin
exports.createPendaftarManual = async (req, res) => {
  const {
    id_tahun, nama_lengkap, nama_panggilan, jenis_kelamin,
    tempat_lahir, tanggal_lahir, anak_ke, jumlah_saudara,
    alamat, no_hp, email, asal_sekolah, jurusan_asal,
    tahun_lulus, nilai_rata_rapor, kemampuan_quran, juz_hafalan,
    orangtua,
  } = req.body;

  try {
    const tahun = await prisma.ppdb_tahun.findFirst({ where: { id: parseInt(id_tahun), is_active: true } });
    if (!tahun) return res.status(404).json({ success: false, message: "Gelombang PPDB tidak ditemukan" });

    // Generate nomor pendaftaran
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.ppdb_pendaftar.count({ where: { id_tahun: parseInt(id_tahun) } });
    const no_pendaftaran = `PPDB-${tahun.tahun_ajaran.replace("/", "")}-${String(count + 1).padStart(4, "0")}`;

    const newPendaftar = await prisma.ppdb_pendaftar.create({
      data: {
        id_tahun: parseInt(id_tahun),
        nama_lengkap, nama_panggilan, jenis_kelamin,
        tempat_lahir,
        tanggal_lahir: new Date(tanggal_lahir),
        anak_ke: anak_ke ? parseInt(anak_ke) : null,
        jumlah_saudara: jumlah_saudara ? parseInt(jumlah_saudara) : null,
        alamat, no_hp, email,
        asal_sekolah, jurusan_asal, tahun_lulus,
        nilai_rata_rapor: nilai_rata_rapor ? parseFloat(nilai_rata_rapor) : null,
        kemampuan_quran: kemampuan_quran || null,
        juz_hafalan: juz_hafalan ? parseInt(juz_hafalan) : 0,
        no_pendaftaran,
        status: "Mendaftar",
      },
    });

    // Simpan data orangtua jika ada
    if (orangtua && Array.isArray(orangtua)) {
      for (const ortu of orangtua) {
        await prisma.ppdb_orangtua.create({
          data: {
            id_pendaftar: newPendaftar.id,
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

    await logActivity(req.user.id, req.user.role, "CREATE", "ppdb_pendaftar", newPendaftar.id, `Input pendaftar manual: ${nama_lengkap} (${no_pendaftaran})`);

    return res.status(201).json({
      success: true,
      message: `Pendaftar berhasil ditambahkan dengan nomor ${no_pendaftaran}`,
      data: { ...newPendaftar, no_pendaftaran },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};
