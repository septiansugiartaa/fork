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

// 1. Get Profile Data Ustadz
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const ustadz = await prisma.users.findUnique({
      where: { id: userId, is_active: true }
    });

    if (!ustadz) {
      return res.status(404).json({ success: false, message: "Data Ustadz tidak ditemukan" });
    }

    const data = {
      data_kepegawaian: { nip: ustadz.nip || "-" },
      data_diri: {
        nama_lengkap: ustadz.nama,
        jenis_kelamin: ustadz.jenis_kelamin,
        tempat_lahir: ustadz.tempat_lahir,
        tanggal_lahir: formatDateForInput(ustadz.tanggal_lahir),
        email: ustadz.email,
        no_hp: ustadz.no_hp,
        alamat: ustadz.alamat,
      },
      foto_profil: ustadz.foto_profil
        ? `http://localhost:3000/uploads/profil/${ustadz.foto_profil}`
        : null
    };

    res.json({ success: true, data });
  } catch (err) {
    console.error("Error getProfile:", err);
    res.status(500).json({ success: false, message: "Gagal mengambil data profil" });
  }
};

// 2. Update Data Diri
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, email, no_hp, alamat } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        nama: nama_lengkap,
        jenis_kelamin: jenis_kelamin,
        tempat_lahir: tempat_lahir,
        tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
        email: email,
        no_hp: no_hp,
        alamat: alamat,
      },
    });

    res.json({ success: true, message: "Data profil berhasil diperbarui" });
  } catch (err) {
    console.error("Error updateProfile Ustadz:", err);
    res.status(500).json({ success: false, message: "Gagal memperbarui data profil" });
  }
};

// 3. Update Password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password_baru } = req.body;

    if (!password_baru || password_baru.length < 6) {
      return res.status(400).json({ success: false, message: "Password minimal 6 karakter" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password_baru, salt);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (err) {
    console.error("Error updatePassword Ustadz:", err);
    res.status(500).json({ success: false, message: "Gagal mengubah password" });
  }
};

// 4. Update Foto Profil
exports.updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file yang diunggah" });
    }

    const oldUser = await prisma.users.findUnique({ where: { id: userId } });
    
    if (oldUser.foto_profil) {
      const oldPath = path.join(process.cwd(), "public/uploads/profil", oldUser.foto_profil);
      
      if (fs.existsSync(oldPath)) {
        try { 
            fs.unlinkSync(oldPath); 
        } catch (e) { 
            console.error("Gagal hapus foto lama:", e); 
        }
      }
    }

    await prisma.users.update({
      where: { id: userId },
      data: { foto_profil: req.file.filename },
    });

    const newPhotoUrl = `http://localhost:3000/uploads/profil/${req.file.filename}`;

    res.json({ 
        success: true, 
        message: "Foto profil berhasil diperbarui", 
        data: { url: newPhotoUrl } 
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Gagal mengunggah foto" });
  }
};