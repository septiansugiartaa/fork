const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.register = async (req, res) => {
    const { nip, nama, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Password and confirm password do not match' });
    }

    try {
        const existingUser = await prisma.users.findFirst({ where: { nip } });
        if (existingUser) return res.status(400).json({ message: 'NIS already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: { nip, nama, password: hashedPassword }
        });

        res.status(201).json({ id: user.id, nip: user.nip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        // Menerima 'identifier' (bisa NIP atau No HP) dan 'password'
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'NIP/No HP dan Password wajib diisi' });
        }

        // 1. Cari User berdasarkan NIP ATAU No HP
        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { nip: identifier },
                    { no_hp: identifier }
                ],
                // Pastikan hanya user aktif yang bisa login
                is_active: true
            },
            include: {
                // Include Role untuk keperluan redirect di frontend
                user_role: {
                    include: {
                        role: true
                    }
                }
            }
        });

        // Jika user tidak ditemukan
        if (!user) {
            return res.status(401).json({ message: 'Akun tidak ditemukan atau tidak aktif' });
        }

        // 2. Verifikasi Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah' });
        }

        // 3. Generate Token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                nama: user.nama 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token berlaku 1 hari
        );
        
        // 4. Siapkan data user untuk dikirim ke frontend
        // Ambil nama role dari array user_role (mengambil yang pertama jika ada)
        const userRole = user.user_role.length > 0 ? user.user_role[0].role.role.toLowerCase() : 'santri';

        // Buang data sensitif
        const { password: _, ...userWithoutPassword } = user;
        
        // Tambahkan properti 'role' flat ke object user agar mudah dibaca frontend
        const finalUser = {
            ...userWithoutPassword,
            role: userRole
        };
        
        res.json({ 
            success: true,
            message: 'Login berhasil',
            token, 
            user: finalUser 
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};