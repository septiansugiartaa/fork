const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Helper: Format Date for Input (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

// 1. Get Profile Data
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const santri = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        kelas_santri: {
          where: { is_active: true },
          take: 1,
          orderBy: { id: "desc" },
          include: { kelas: true },
        },
        kamar_santri: {
          where: { is_active: true },
          take: 1,
          orderBy: { tanggal_masuk: "desc" },
          include: { kamar: true },
        },
        // Ambil data orang tua (dimana user ini adalah ANAK / id_santri)
        orangtua: {
          where: { is_active: true },
          include: {
            // Relasi ke data User si Orang Tua
            // Sesuai schema: users_orangtua_id_orangtuaTousers
            users_orangtua_id_orangtuaTousers: true,
          },
        },
      },
    });

    if (!santri) {
      return res
        .status(404)
        .json({ success: false, message: "Santri tidak ditemukan" });
    }

    // Mapping response agar rapi di frontend
    const data = {
      data_pondok: {
        nis: santri.nip || "-",
        kelas: santri.kelas_santri[0]?.kelas?.kelas || "-",
        kamar: santri.kamar_santri[0]?.kamar?.kamar || "-",
      },
      data_diri: {
        nama_lengkap: santri.nama,
        jenis_kelamin: santri.jenis_kelamin,
        tempat_lahir: santri.tempat_lahir,
        tanggal_lahir: formatDateForInput(santri.tanggal_lahir),
        email: santri.email,
        no_hp: santri.no_hp,
        alamat: santri.alamat,
      },
      // URL Foto: Pastikan app.js sudah set static folder ke /uploads
      foto_profil: santri.foto_profil
        ? `http://localhost:3000/uploads/${santri.foto_profil}`
        : null,

      orang_tua: santri.orangtua.map((ot) => ({
        id: ot.id,
        // Ambil nama & hp dari relasi users_orangtua_id_orangtuaTousers
        nama: ot.users_orangtua_id_orangtuaTousers?.nama || "Tanpa Nama",
        hubungan: ot.hubungan,
        no_hp: ot.users_orangtua_id_orangtuaTousers?.no_hp || "-",
      })),
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error getProfile:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data profil" });
  }
};

// 2. Update Data Diri
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nama_lengkap,
      jenis_kelamin,
      tempat_lahir,
      tanggal_lahir,
      email,
      no_hp,
      alamat,
    } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        nama: nama_lengkap,
        jenis_kelamin: jenis_kelamin,
        tempat_lahir,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
        email,
        no_hp,
        alamat,
      },
    });

    res.json({ success: true, message: "Data diri berhasil diperbarui" });
  } catch (err) {
    console.error("Error updateProfile:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui data diri" });
  }
};

// 3. Update Password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password_baru } = req.body;

    if (!password_baru || password_baru.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password minimal 6 karakter" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password_baru, salt);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    console.error("Error updatePassword:", err);
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah password" });
  }
};

// 4. Update Foto Profil
exports.updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Tidak ada file yang diunggah" });
    }

    // Hapus foto lama jika ada
    const oldUser = await prisma.users.findUnique({ where: { id: userId } });
    if (oldUser.foto_profil) {
      // Path disesuaikan: Controller -> src/controllers/santri -> ../../../public/uploads
      const oldPath = path.join(
        __dirname,
        "../../../public/uploads",
        oldUser.foto_profil,
      );
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("Gagal hapus foto lama:", e);
        }
      }
    }

    // Simpan nama file baru ke database
    await prisma.users.update({
      where: { id: userId },
      data: { foto_profil: req.file.filename },
    });

    const newPhotoUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "Foto profil berhasil diperbarui",
      data: { url: newPhotoUrl },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Gagal mengunggah foto" });
  }
};

// 5. Tambah Orang Tua (Create User Baru + Link Relasi)
exports.addOrangTua = async (req, res) => {
  try {
    const userId = req.user.id;
    // Terima parameter 'id_user_wali' (ID User jika hasil search)
    const { hubungan, nama, no_hp, id_user_wali } = req.body;

    if (!nama || !hubungan || !no_hp) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Nama, Hubungan, dan No HP wajib diisi",
        });
    }

    let parentUser = null;

    // SKENARIO 1: Input dari Hasil Search (Ada ID User)
    if (id_user_wali) {
      parentUser = await prisma.users.findUnique({
        where: { id: id_user_wali },
      });
      if (!parentUser) {
        return res
          .status(404)
          .json({ success: false, message: "User wali tidak ditemukan" });
      }
    }
    // SKENARIO 2: Input Manual (Tidak ada ID User)
    else {
      // Cek apakah No HP sudah terdaftar?
      const existingUser = await prisma.users.findFirst({
        where: { no_hp: no_hp },
      });

      // JIKA SUDAH ADA -> TOLAK! (Biar user pake search)
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "Nomor HP sudah terdaftar! Silakan gunakan fitur pencarian untuk menghubungkan data.",
        });
      }

      // Jika belum ada -> Buat User Baru
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(no_hp, salt);

      parentUser = await prisma.users.create({
        data: {
          nama: nama,
          no_hp: no_hp,
          password: hashedPassword,
          is_active: true,
        },
      });
    }

    // Cek apakah hubungan ini sudah pernah ada sebelumnya? (Opsional, biar ga double link)
    const existingLink = await prisma.orangtua.findFirst({
      where: {
        id_santri: userId,
        id_orangtua: parentUser.id,
      },
    });

    if (existingLink) {
      // Jika sudah terhubung tapi is_active false, aktifkan lagi
      if (!existingLink.is_active) {
        await prisma.orangtua.update({
          where: { id: existingLink.id },
          data: { is_active: true, hubungan: hubungan },
        });
        return res.json({
          success: true,
          message: "Data orang tua berhasil diaktifkan kembali.",
        });
      }
      return res
        .status(400)
        .json({
          success: false,
          message: "Orang tua ini sudah terhubung dengan Anda.",
        });
    }

    // Create Link
    await prisma.orangtua.create({
      data: {
        id_santri: userId,
        id_orangtua: parentUser.id,
        hubungan: hubungan,
        is_active: true,
      },
    });

    res.json({
      success: true,
      message: id_user_wali
        ? "Data berhasil ditautkan."
        : "Data baru berhasil dibuat.",
    });
  } catch (err) {
    console.error("Error addOrangTua:", err);
    res.status(500).json({ success: false, message: "Gagal memproses data" });
  }
};

// Update Data Orang Tua
exports.updateOrangTua = async (req, res) => {
  try {
    const { id } = req.params;
    const { hubungan, nama, no_hp } = req.body;

    // 1. Cari data relasi dulu
    const relasi = await prisma.orangtua.findUnique({
      where: { id: parseInt(id) },
      include: {
        // PERBAIKAN: Gunakan nama relasi yang benar sesuai Schema & getProfile
        users_orangtua_id_orangtuaTousers: true,
      },
    });

    if (!relasi) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    }

    const idUserWali = relasi.id_orangtua;

    // 2. Update Tabel Relasi (Hubungan)
    await prisma.orangtua.update({
      where: { id: parseInt(id) },
      data: { hubungan: hubungan },
    });

    // 3. Update Tabel Users (Nama & HP)
    // PERBAIKAN: Akses data lama menggunakan nama relasi yang benar
    const oldUserData = relasi.users_orangtua_id_orangtuaTousers;

    // Cek duplikasi HP hanya jika HP berubah
    if (no_hp && oldUserData && no_hp !== oldUserData.no_hp) {
      const existingUser = await prisma.users.findFirst({
        where: { no_hp: no_hp },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Nomor HP sudah digunakan oleh akun lain.",
        });
      }
    }

    if (idUserWali) {
      await prisma.users.update({
        where: { id: idUserWali },
        data: {
          nama: nama,
          no_hp: no_hp,
        },
      });
    }

    res.json({ success: true, message: "Data orang tua berhasil diperbarui" });
  } catch (err) {
    console.error("Error updateOrangTua:", err);
    res.status(500).json({ success: false, message: "Gagal memperbarui data" });
  }
};

// 6. Hapus Orang Tua
exports.deleteOrangTua = async (req, res) => {
  try {
    const { id } = req.params; // ID tabel orangtua (primary key relasi)

    // 1. Ambil data relasi dulu sebelum dihapus/diupdate
    // Kita butuh tau 'id_orangtua' (ID User-nya) siapa
    const relasiLama = await prisma.orangtua.findUnique({
      where: { id: parseInt(id) },
    });

    if (!relasiLama) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    }

    const idUserWali = relasiLama.id_orangtua;

    // 2. Lakukan Soft Delete pada relasi (tabel orangtua)
    await prisma.orangtua.update({
      where: { id: parseInt(id) },
      data: { is_active: false },
    });

    // 3. LOGIKA CERDAS: Cek apakah user wali ini masih punya anak lain yang aktif?
    // Cari di tabel orangtua, hitung berapa record aktif yang dimiliki user ini
    const sisaAnak = await prisma.orangtua.count({
      where: {
        id_orangtua: idUserWali,
        is_active: true,
      },
    });

    // 4. Jika sisaAnak == 0, berarti dia sudah tidak punya urusan lagi di sistem
    // Maka: Matikan akun User-nya agar tidak bisa login lagi
    if (sisaAnak === 0 && idUserWali) {
      await prisma.users.update({
        where: { id: idUserWali },
        data: { is_active: false },
      });
    }

    res.json({ success: true, message: "Data orang tua berhasil dihapus" });
  } catch (err) {
    console.error("Error deleteOrangTua:", err);
    res.status(500).json({ success: false, message: "Gagal menghapus data" });
  }
};

// 7. Cari User (Untuk Modal Tambah Orang Tua)
exports.searchUser = async (req, res) => {
  try {
    const { q } = req.query; // Query search (nama atau no_hp)

    if (!q || q.length < 3) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.users.findMany({
      where: {
        OR: [
          { nama: { contains: q } }, // Cari berdasarkan nama
          { no_hp: { contains: q } }, // Cari berdasarkan no_hp
        ],
        is_active: true,
      },
      select: {
        id: true,
        nama: true,
        no_hp: true,
      },
    });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ success: false, message: "Gagal mencari data" });
  }
};
