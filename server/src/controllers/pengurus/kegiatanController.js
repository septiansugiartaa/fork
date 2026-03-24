const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatFullDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
};

const formatTimeRange = (start, end) => {
    if (!start || !end) return "-";
    const formatTime = (dateObj) => {
        return new Date(dateObj).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
        });
    };
    return `${formatTime(start)} - ${formatTime(end)} WIB`;
};

// 1. GET: Lihat Semua Kegiatan (Global & Kelas)
exports.getKegiatan = async (req, res) => {
    try {
        const { search, type } = req.query; 

        // PERUBAHAN: Hapus batasan id_kelas: null agar bisa narik SEMUA kegiatan
        let whereCondition = {
            is_active: true
        };
        
        if (search) {
            whereCondition.nama_kegiatan = { contains: search };
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (type === 'Mendatang') {
            whereCondition.tanggal = { gte: today };
        } else if (type === 'Selesai') {
            whereCondition.tanggal = { lt: today };
        }

        const kegiatans = await prisma.kegiatan.findMany({
            where: whereCondition,
            orderBy: { tanggal: 'desc' },
            include: {
                users: { select: { nama: true } },
                kelas: { select: { kelas: true } } 
            }
        });

        const data = kegiatans.map(k => {
            const kegDate = new Date(k.tanggal);
            kegDate.setHours(0,0,0,0);
            const statusWaktu = kegDate >= today ? "Mendatang" : "Selesai";

            return {
                id: k.id,
                nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal),
                waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi,
                deskripsi: k.deskripsi || "Tidak ada deskripsi.",
                nama_penanggung_jawab: k.users?.nama || "Admin Pondok",
                status_waktu: statusWaktu,
                
                skala: k.id_kelas && k.kelas ? k.kelas.kelas : "Seluruh Pesantren",
                id_kelas: k.id_kelas,

                raw_tanggal: k.tanggal ? new Date(k.tanggal).toISOString().split('T')[0] : "",
                raw_waktu_mulai: k.waktu_mulai ? new Date(k.waktu_mulai).toISOString().substring(11, 16) : "",
                raw_waktu_selesai: k.waktu_selesai ? new Date(k.waktu_selesai).toISOString().substring(11, 16) : ""
            };
        });

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getKegiatan Pengurus:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan pondok' });
    }
};

// 2. POST: Buat Kegiatan Global
exports.createKegiatan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi } = req.body;

        if (!nama_kegiatan || !tanggal || !waktu_mulai || !waktu_selesai || !lokasi) {
            return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi!' });
        }

        const timeStart = new Date(`1970-01-01T${waktu_mulai}:00Z`);
        const timeEnd = new Date(`1970-01-01T${waktu_selesai}:00Z`);

        await prisma.kegiatan.create({
            data: {
                nama_kegiatan: nama_kegiatan,
                tanggal: new Date(tanggal),
                waktu_mulai: timeStart,
                waktu_selesai: timeEnd,
                lokasi: lokasi,
                deskripsi: deskripsi,
                penanggung_jawab: userId,
                id_kelas: null, // Paksa Global
                rutin: false,
                is_active: true
            }
        });

        res.status(201).json({ success: true, message: 'Kegiatan Pondok berhasil ditambahkan!' });
    } catch (err) {
        console.error("Error createKegiatan Pengurus:", err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan kegiatan baru' });
    }
};

// 3. PUT: Edit Kegiatan Global
exports.updateKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi } = req.body;

        const timeStart = new Date(`1970-01-01T${waktu_mulai}:00Z`);
        const timeEnd = new Date(`1970-01-01T${waktu_selesai}:00Z`);

        await prisma.kegiatan.update({
            where: { id: parseInt(id) },
            data: {
                nama_kegiatan: nama_kegiatan,
                tanggal: new Date(tanggal),
                waktu_mulai: timeStart,
                waktu_selesai: timeEnd,
                lokasi: lokasi,
                deskripsi: deskripsi,
                id_kelas: null // Pastikan tetap Global
            }
        });

        res.json({ success: true, message: 'Kegiatan Pondok berhasil diperbarui!' });
    } catch (err) {
        console.error("Error updateKegiatan Pengurus:", err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui kegiatan pondok' });
    }
};

// 4. DELETE: Hapus Kegiatan Global (Soft Delete)
exports.deleteKegiatan = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.kegiatan.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });

        res.json({ success: true, message: 'Kegiatan berhasil dihapus' });
    } catch (err) {
        console.error("Error deleteKegiatan Pengurus:", err);
        res.status(500).json({ success: false, message: 'Gagal menghapus kegiatan' });
    }
};