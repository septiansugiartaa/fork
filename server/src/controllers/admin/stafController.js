const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// Helper untuk mengambil list staf
exports.getStaffList = async (req, res) => {
  try {
    const targetRoles = ['Admin', 'Pimpinan', 'Timkes', 'Pengurus'];
    const staff = await prisma.users.findMany({
      where: {
        is_active: true,
        user_role: { some: { is_active: true, role: { role: { in: targetRoles } } } }
      },
      include: { user_role: { where: { is_active: true }, include: { role: true } } },
      orderBy: { nama: 'asc' }
    });

    const formattedData = staff.map(user => ({
      id: user.id,
      nip: user.nip || "-",
      nama: user.nama || "Tanpa Nama",
      email: user.email || "-",
      no_hp: user.no_hp || "-",
      jenis_kelamin: user.jenis_kelamin,
      roles: user.user_role.map(ur => ur.role.role), 
      foto_profil: user.foto_profil || null
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat data staf" });
  }
};

// CREATE STAF BARU (Transaction & Validasi NIP)
exports.createStaff = async (req, res) => {
  try {
    const { nip, nama, email, no_hp, jenis_kelamin, roles } = req.body;
    
    if (nip && nip !== "") {
        const existingNip = await prisma.users.findFirst({
            where: { nip: nip }
        });
        if (existingNip) {
            return res.status(400).json({ 
                success: false, 
                message: "Gagal menyimpan: NIP tersebut sudah terdaftar di sistem!" 
            });
        }
    }

    const hashedPassword = await bcrypt.hash("12345678", 10);

    const roleRecords = await prisma.role.findMany({ where: { role: { in: roles } } });
    
    if (roleRecords.length === 0) return res.status(400).json({ success: false, message: "Role tidak valid" });

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: { nip, nama, email, no_hp, jenis_kelamin, password: hashedPassword, is_active: true }
      });

      const userRolesData = roleRecords.map(r => ({
        id_user: newUser.id,
        id_role: r.id,
        is_active: true
      }));

      await tx.user_role.createMany({ data: userRolesData });
    });

    res.json({ success: true, message: "Staf berhasil ditambahkan" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal menambah staf" });
  }
};

// UPDATE STAF
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id);
    const { nip, nama, email, no_hp, jenis_kelamin, roles } = req.body;

    if (nip && nip !== "") {
        const existingNip = await prisma.users.findFirst({
            where: { 
                nip: nip,
                id: { not: targetId }
            }
        });
        if (existingNip) {
            return res.status(400).json({ 
                success: false, 
                message: "Gagal menyimpan: NIP tersebut sudah dipakai oleh staf/pengguna lain!" 
            });
        }
    }

    const roleRecords = await prisma.role.findMany({ where: { role: { in: roles } } });

    await prisma.$transaction(async (tx) => {
      // 1. Update profil dasar
      await tx.users.update({
        where: { id: targetId },
        data: { nip, nama, email, no_hp, jenis_kelamin }
      });

      // 2. Hapus (Soft Delete) semua role lama
      await tx.user_role.updateMany({
        where: { id_user: targetId },
        data: { is_active: false }
      });

      // 3. Masukkan role yang baru dicentang (Atau update jadi true jika sudah ada)
      for (const r of roleRecords) {
        const existingRole = await tx.user_role.findFirst({
          where: { id_user: targetId, id_role: r.id }
        });

        if (existingRole) {
          await tx.user_role.update({ where: { id: existingRole.id }, data: { is_active: true } });
        } else {
          await tx.user_role.create({ data: { id_user: targetId, id_role: r.id, is_active: true } });
        }
      }
    });

    res.json({ success: true, message: "Data staf berhasil diperbarui" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memperbarui staf" });
  }
};

// SOFT DELETE STAF
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.users.update({ where: { id: parseInt(id) }, data: { is_active: false } }),
      prisma.user_role.updateMany({ where: { id_user: parseInt(id) }, data: { is_active: false } })
    ]);
    res.json({ success: true, message: "Akun staf berhasil dinonaktifkan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menonaktifkan staf" });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const hashedPassword = await bcrypt.hash("12345678", 10);
    
    await prisma.users.update({
      where: { id: parseInt(id) },
      data: { password: hashedPassword }
    });
    res.json({ success: true, message: "Password berhasil direset ke '12345678'" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mereset password" });
  }
};