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

exports.getKegiatan = async (req, res) => {
    try {
        const { search, type } = req.query; 

        let whereCondition = { is_active: true };
        
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
                users: { select: { nama: true } }
            }
        });

        const data = kegiatans.map(k => {
            const kegDate = new Date(k.tanggal);
            kegDate.setHours(0,0,0,0);
            const statusWaktu = kegDate >= today ? "Mendatang" : "Selesai";

            // Ekstrak nilai RAW untuk diumpankan ke input form Edit
            const rawTanggal = k.tanggal ? new Date(k.tanggal).toISOString().split('T')[0] : "";
            const rawWaktuMulai = k.waktu_mulai ? new Date(k.waktu_mulai).toISOString().substring(11, 16) : "";
            const rawWaktuSelesai = k.waktu_selesai ? new Date(k.waktu_selesai).toISOString().substring(11, 16) : "";

            return {
                id: k.id,
                nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal),
                waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi,
                deskripsi: k.deskripsi || "Tidak ada deskripsi.",
                nama_penanggung_jawab: k.users?.nama || "Admin Pondok",
                status_waktu: statusWaktu,
                // Data RAW untuk form edit
                raw_tanggal: rawTanggal,
                raw_waktu_mulai: rawWaktuMulai,
                raw_waktu_selesai: rawWaktuSelesai
            };
        });

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getKegiatan Ustadz:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan' });
    }
};

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
                rutin: false,
                is_active: true
            }
        });

        res.status(201).json({ success: true, message: 'Kegiatan berhasil ditambahkan!' });
    } catch (err) {
        console.error("Error createKegiatan:", err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan kegiatan baru' });
    }
};

// Fungsi Edit
exports.updateKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi } = req.body;

        if (!nama_kegiatan || !tanggal || !waktu_mulai || !waktu_selesai || !lokasi) {
            return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi!' });
        }

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
                deskripsi: deskripsi
            }
        });

        res.json({ success: true, message: 'Kegiatan berhasil diperbarui!' });
    } catch (err) {
        console.error("Error updateKegiatan:", err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui kegiatan' });
    }
};