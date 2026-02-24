const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const formatDateForInput = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

// 1. Get Profile Data
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const ortu = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        orangtua_orangtua_id_orangtuaTousers: {
          where: { is_active: true },
          include: {
            users: {
              include: {
                kelas_santri: {
                  where: { is_active: true }, take: 1, orderBy: { id: "desc" },
                  include: { kelas: true }
                },
                kamar_santri: {
                  where: { is_active: true }, take: 1, orderBy: { tanggal_masuk: "desc" },
                  include: { kamar: true }
                }
              }
            }
          }
        }
      }
    });

    if (!ortu) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

    const data = {
      data_diri: {
        nama_lengkap: ortu.nama || "",
        jenis_kelamin: ortu.jenis_kelamin || "",
        email: ortu.email || "",
        no_hp: ortu.no_hp || "",
        alamat: ortu.alamat || "",
      },
      foto_profil: ortu.foto_profil ? `http://localhost:3000/foto-profil/${ortu.foto_profil}` : null,
      
      anak: ortu.orangtua_orangtua_id_orangtuaTousers.map((rel) => ({
        id: rel.users.id,
        nama: rel.users.nama,
        nip: rel.users.nip || "-",
        hubungan: rel.hubungan || "Wali",
        kelas: rel.users.kelas_santri[0]?.kelas?.kelas || "-",
        kamar: rel.users.kamar_santri[0]?.kamar?.kamar || "-",
        foto: rel.users.foto_profil ? `http://localhost:3000/foto-profil/${rel.users.foto_profil}` : null
      }))
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
    const { nama_lengkap, jenis_kelamin, email, no_hp, alamat } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        nama: nama_lengkap,
        jenis_kelamin,
        email,
        no_hp,
        alamat,
      },
    });

    res.json({ success: true, message: "Data diri berhasil diperbarui" });
  } catch (err) {
    console.error("Error updateProfile:", err);
    res.status(500).json({ success: false, message: "Gagal memperbarui data" });
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
    console.error("Error updatePassword:", err);
    res.status(500).json({ success: false, message: "Gagal mengubah password" });
  }
};

// 4. Update Foto Profil
exports.updatePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ success: false, message: "Tidak ada file" });

    const oldUser = await prisma.users.findUnique({ where: { id: userId } });
    if (oldUser.foto_profil) {
      const oldPath = path.join(__dirname, "../../../public/uploads/profil", oldUser.foto_profil);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await prisma.users.update({
      where: { id: userId },
      data: { foto_profil: req.file.filename },
    });

    res.json({
      success: true,
      message: "Foto profil diperbarui",
      data: { url: `http://localhost:3000/foto-profil/${req.file.filename}` },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Gagal mengunggah foto" });
  }
};