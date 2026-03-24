const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
  const { nip, nama, password, confirmPassword, no_hp } = req.body;

  // 1. Validasi Input Dasar
  if (!nip || !nama || !password || !confirmPassword) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password dan konfirmasi password tidak cocok" });
  }

  try {
    // 2. Cek apakah NIP sudah terdaftar
    const existingUser = await prisma.users.findFirst({
      where: { nip: nip },
    });

    if (existingUser) {
      return res.status(400).json({ message: "NIP sudah terdaftar" });
    }

    // 3. Cari Role 'Santri' (Default Role)
    const santriRole = await prisma.role.findFirst({
      where: { role: "Santri" }, // Pastikan di DB tabel role sudah ada isinya 'Santri'
    });

    if (!santriRole) {
      return res
        .status(500)
        .json({
          message: "Sistem Error: Role Santri belum disetting di database",
        });
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Transaction: Create User & Assign Role sekaligus
    const newUser = await prisma.$transaction(async (tx) => {
      // A. Buat User
      const user = await tx.users.create({
        data: {
          nip,
          nama,
          password: hashedPassword,
          no_hp: no_hp || null,
          is_active: true,
        },
      });

      // B. Buat User Role
      await tx.user_role.create({
        data: {
          id_user: user.id,
          id_role: 1,
          is_active: true,
        },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      data: { id: newUser.id, nip: newUser.nip, nama: newUser.nama },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Gagal melakukan registrasi" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "NIP/No HP dan Password wajib diisi" });
    }

    // 1. Cari User
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ nip: identifier }, { no_hp: identifier }, { email: identifier }],
        is_active: true,
      },
      include: {
        user_role: {
          where: { is_active: true }, // Pastikan hanya role yang aktif
          include: { role: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Akun tidak ditemukan atau tidak aktif" });
    }

    // 2. Verifikasi Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // 3. Cek Jumlah Role Aktif
    const activeRoles = user.user_role.map(ur => ur.role.role);

    // Skenario A: User punya lebih dari 1 role (Multi-Role)
    if (activeRoles.length > 1) {
      return res.json({
        success: true,
        requireRoleSelection: true,
        message: "Silakan pilih hak akses",
        availableRoles: activeRoles,
        userId: user.id // Kirim ID user sementara untuk finalize nanti
      });
    }

    // Skenario B: User hanya punya 1 role atau tidak punya role (Default ke 'user')
    const roleName = activeRoles.length === 1 ? activeRoles[0] : "user";

    // Generate Token JWT
    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: roleName },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _, ...userData } = user;
    const finalUser = {
      id: userData.id,
      nip: userData.nip,
      nama: userData.nama,
      email: userData.email,
      no_hp: userData.no_hp,
      foto_profil: userData.foto_profil,
      role: roleName.toLowerCase(),
    };

    res.json({
      success: true,
      requireRoleSelection: false,
      message: "Login berhasil",
      token,
      user: finalUser,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

exports.finalizeLogin = async (req, res) => {
  try {
    const { userId, selectedRole } = req.body;

    if (!userId || !selectedRole) {
       return res.status(400).json({ message: "Data tidak valid" });
    }

    // Ambil data user lagi untuk dimasukkan ke JWT
    const user = await prisma.users.findUnique({
       where: { id: userId, is_active: true }
    });

    if (!user) {
       return res.status(401).json({ message: "Sesi login tidak valid" });
    }

    // Generate Token JWT Final
    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: selectedRole },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const { password: _, ...userData } = user;
    const finalUser = {
      id: userData.id,
      nip: userData.nip,
      nama: userData.nama,
      email: userData.email,
      no_hp: userData.no_hp,
      foto_profil: userData.foto_profil,
      role: selectedRole.toLowerCase(),
    };

    res.json({
      success: true,
      message: `Login berhasil sebagai ${selectedRole}`,
      token,
      user: finalUser,
    });
  } catch (err) {
    console.error("Finalize Login Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const activeRole = req.user.role; 

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        nama: user.nama,
        role: activeRole 
      }
    });

  } catch (error) {
    console.error("Error get current user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};