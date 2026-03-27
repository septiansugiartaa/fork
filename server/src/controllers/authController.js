const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const prisma = require('../config/prisma');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Validasi kekuatan password.
 * Min 8 karakter, setidaknya 1 huruf dan 1 angka.
 */
const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return 'Password minimal 8 karakter.';
    }
    if (!/[a-zA-Z]/.test(password)) {
        return 'Password harus mengandung setidaknya 1 huruf.';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password harus mengandung setidaknya 1 angka.';
    }
    return null; // valid
};

const buildFinalUser = (userData, roleName) => ({
    id:          userData.id,
    nip:         userData.nip,
    nama:        userData.nama,
    email:       userData.email,
    no_hp:       userData.no_hp,
    foto_profil: userData.foto_profil,
    role:        roleName.toLowerCase(),
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    const { nip, nama, password, confirmPassword, no_hp } = req.body;

    if (!nip || !nama || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Password dan konfirmasi password tidak cocok.' });
    }

    const pwError = validatePassword(password);
    if (pwError) {
        return res.status(400).json({ message: pwError });
    }

    try {
        const existingUser = await prisma.users.findFirst({ where: { nip } });
        if (existingUser) {
            return res.status(400).json({ message: 'NIP sudah terdaftar.' });
        }

        const santriRole = await prisma.role.findFirst({ where: { role: 'Santri' } });
        if (!santriRole) {
            return res.status(500).json({ message: 'Sistem Error: Role Santri belum dikonfigurasi.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // cost factor 12

        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: { nip, nama, password: hashedPassword, no_hp: no_hp || null, is_active: true },
            });
            await tx.user_role.create({
                data: { id_user: user.id, id_role: santriRole.id, is_active: true },
            });
            return user;
        });

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil.',
            data: { id: newUser.id, nip: newUser.nip, nama: newUser.nama },
        });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({ message: 'Gagal melakukan registrasi.' });
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'NIP/No HP dan Password wajib diisi.' });
        }

        const user = await prisma.users.findFirst({
            where: {
                OR: [{ nip: identifier }, { no_hp: identifier }, { email: identifier }],
                is_active: true,
            },
            include: {
                user_role: {
                    where: { is_active: true },
                    include: { role: true },
                },
            },
        });

        // Gunakan pesan yang sama untuk "tidak ditemukan" dan "password salah"
        // agar tidak bisa dipakai untuk user enumeration.
        if (!user) {
            return res.status(401).json({ message: 'Kredensial tidak valid.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Kredensial tidak valid.' });
        }

        const activeRoles = user.user_role.map(ur => ur.role.role);

        // Multi-role: minta user pilih role terlebih dahulu.
        // Kirim HANYA role yang tersedia — JANGAN kirim userId ke client.
        // Sebagai gantinya, buat short-lived token khusus role selection.
        if (activeRoles.length > 1) {
            const selectionToken = jwt.sign(
                { id: user.id, purpose: 'role_selection' },
                process.env.JWT_SECRET,
                { expiresIn: '5m' } // Hanya berlaku 5 menit
            );
            return res.json({
                success: true,
                requireRoleSelection: true,
                message: 'Silakan pilih hak akses.',
                availableRoles: activeRoles,
                selectionToken, // token sementara, bukan userId mentah
            });
        }

        const roleName = activeRoles.length === 1 ? activeRoles[0] : 'user';

        const token = jwt.sign(
            { id: user.id, nama: user.nama, role: roleName },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const { password: _pw, ...userData } = user;

        return res.json({
            success: true,
            requireRoleSelection: false,
            message: 'Login berhasil.',
            token,
            user: buildFinalUser(userData, roleName),
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// ─── FINALIZE LOGIN (Multi-Role) ──────────────────────────────────────────────
exports.finalizeLogin = async (req, res) => {
    try {
        const { selectionToken, selectedRole } = req.body;

        if (!selectionToken || !selectedRole) {
            return res.status(400).json({ message: 'Data tidak valid.' });
        }

        // Verifikasi selection token
        let payload;
        try {
            payload = jwt.verify(selectionToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Token pemilihan role tidak valid atau sudah kadaluarsa.' });
        }

        if (payload.purpose !== 'role_selection') {
            return res.status(401).json({ message: 'Token tidak valid untuk operasi ini.' });
        }

        // ── FIX KRITIS: Verifikasi bahwa user BENAR-BENAR memiliki selectedRole ──
        // Ini mencegah role injection — sebelumnya selectedRole langsung dipercaya dari body.
        const userWithRoles = await prisma.users.findUnique({
            where: { id: payload.id, is_active: true },
            include: {
                user_role: {
                    where: { is_active: true },
                    include: { role: true },
                },
            },
        });

        if (!userWithRoles) {
            return res.status(401).json({ message: 'Akun tidak ditemukan atau tidak aktif.' });
        }

        const allowedRoles = userWithRoles.user_role.map(ur => ur.role.role.toLowerCase());
        const requestedRole = selectedRole.toLowerCase();

        if (!allowedRoles.includes(requestedRole)) {
            return res.status(403).json({
                message: `Akses ditolak. Role '${selectedRole}' tidak dimiliki oleh akun ini.`,
            });
        }

        // Role valid — terbitkan JWT final
        const token = jwt.sign(
            { id: userWithRoles.id, nama: userWithRoles.nama, role: selectedRole },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const { password: _pw, ...userData } = userWithRoles;

        return res.json({
            success: true,
            message: `Login berhasil sebagai ${selectedRole}.`,
            token,
            user: buildFinalUser(userData, selectedRole),
        });
    } catch (err) {
        console.error('Finalize Login Error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
exports.getCurrentUser = async (req, res) => {
    try {
        const userId     = req.user.id;
        const activeRole = req.user.role;

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { id: true, nama: true, foto_profil: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }

        return res.json({
            success: true,
            data: { id: user.id, nama: user.nama, role: activeRole, foto_profil: user.foto_profil },
        });
    } catch (error) {
        console.error('Get Current User Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
