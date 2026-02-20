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
    // Kita gunakan transaction agar kalau salah satu gagal, semuanya dibatalkan
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
    // Menerima 'identifier' (bisa NIP atau No HP) dan 'password'
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "NIP/No HP dan Password wajib diisi" });
    }

    // 1. Cari User berdasarkan NIP ATAU No HP
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ nip: identifier }, { no_hp: identifier }, { email: identifier }],
        is_active: true, // Hanya user aktif yang boleh login
      },
      include: {
        // Include Role agar frontend tahu dia login sebagai apa
        user_role: {
          include: {
            role: true,
          },
        },
      },
    });

    // Jika user tidak ditemukan
    if (!user) {
      return res
        .status(401)
        .json({ message: "Akun tidak ditemukan atau tidak aktif" });
    }

    // 2. Verifikasi Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // 3. Ekstrak Role User (Flattening)
    // Ambil role pertama dari array user_role. Jika kosong default ke 'user'
    const roleName =
      user.user_role.length > 0 && user.user_role[0].role
        ? user.user_role[0].role.role
        : "user";

    // 4. Generate Token JWT
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        role: roleName, // PENTING: Masukkan role ke dalam token
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }, // Token berlaku 1 hari
    );

    // 5. Siapkan Response (Buang password dari object user)
    const { password: _, ...userData } = user;

    // Buat object user yang bersih dan mudah dibaca Frontend
    const finalUser = {
      id: userData.id,
      nip: userData.nip,
      nama: userData.nama,
      email: userData.email,
      no_hp: userData.no_hp,
      foto_profil: userData.foto_profil,
      role: roleName.toLowerCase(), // Kirim role sebagai string lowercase (contoh: 'santri')
    };

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: finalUser,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};
