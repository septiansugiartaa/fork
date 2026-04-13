const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatFullDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeRange = (start, end) => {
    if (!start || !end) return "-";
    const formatTime = (dateObj) => new Date(dateObj).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    return `${formatTime(start)} - ${formatTime(end)} WIB`;
};

exports.getKegiatan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search, type } = req.query; 

        const kelasUstadz = await prisma.kelas.findMany({ where: { id_wali: userId, is_active: true } });
        const kamarUstadz = await prisma.kamar.findMany({ where: { id_wali: userId, is_active: true } });

        const classIds = kelasUstadz.map(k => k.id);
        const kamarIds = kamarUstadz.map(k => k.id);

        // Tampilkan kegiatan umum (id_kelas null, id_kamar null) + yang untuk kelas/kamar yg diwali
        let whereCondition = {
            is_active: true,
            OR: [
                { id_kelas: null, id_kamar: null },
                ...(classIds.length > 0 ? [{ id_kelas: { in: classIds } }] : []),
                ...(kamarIds.length > 0 ? [{ id_kamar: { in: kamarIds } }] : []),
            ]
        };
        
        if (search) {
            whereCondition = {
                ...whereCondition,
                AND: [{ nama_kegiatan: { contains: search } }]
            };
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
                kelas: { select: { kelas: true } },
                kamar: { select: { kamar: true } }
            }
        });

        const data = kegiatans.map(k => {
            const kegDate = new Date(k.tanggal);
            kegDate.setHours(0,0,0,0);
            const statusWaktu = kegDate >= today ? "Mendatang" : "Selesai";

            let skala = "Seluruh Pesantren";
            if (k.kelas) skala = `Kelas: ${k.kelas.kelas}`;
            else if (k.kamar) skala = `Kamar: ${k.kamar.kamar}`;

            return {
                id: k.id,
                nama: k.nama_kegiatan,
                tanggal: formatFullDate(k.tanggal),
                waktu: formatTimeRange(k.waktu_mulai, k.waktu_selesai),
                lokasi: k.lokasi,
                deskripsi: k.deskripsi || "Tidak ada deskripsi.",
                nama_penanggung_jawab: k.users?.nama || "Admin Pondok",
                status_waktu: statusWaktu,
                skala,
                id_kelas: k.id_kelas,
                id_kamar: k.id_kamar,
                raw_tanggal: k.tanggal ? new Date(k.tanggal).toISOString().split('T')[0] : "",
                raw_waktu_mulai: k.waktu_mulai ? new Date(k.waktu_mulai).toISOString().substring(11, 16) : "",
                raw_waktu_selesai: k.waktu_selesai ? new Date(k.waktu_selesai).toISOString().substring(11, 16) : ""
            };
        });

        res.json({ success: true, data, list_kelas: kelasUstadz, list_kamar: kamarUstadz });

    } catch (err) {
        console.error("Error getKegiatan Ustadz:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar kegiatan' });
    }
};

exports.createKegiatan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi, id_kelas, id_kamar } = req.body;

        if (!nama_kegiatan || !tanggal || !waktu_mulai || !waktu_selesai || !lokasi) {
            return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi!' });
        }

        if (!id_kelas && !id_kamar) {
            return res.status(400).json({ success: false, message: 'Pilih kelas atau kamar tujuan kegiatan.' });
        }

        const timeStart = new Date(`1970-01-01T${waktu_mulai}:00Z`);
        const timeEnd = new Date(`1970-01-01T${waktu_selesai}:00Z`);

        await prisma.kegiatan.create({
            data: {
                nama_kegiatan,
                tanggal: new Date(tanggal),
                waktu_mulai: timeStart,
                waktu_selesai: timeEnd,
                lokasi,
                deskripsi,
                penanggung_jawab: userId,
                id_kelas: id_kelas ? parseInt(id_kelas) : null,
                id_kamar: id_kamar ? parseInt(id_kamar) : null,
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

exports.updateKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, lokasi, deskripsi, id_kelas, id_kamar } = req.body;

        const timeStart = new Date(`1970-01-01T${waktu_mulai}:00Z`);
        const timeEnd = new Date(`1970-01-01T${waktu_selesai}:00Z`);

        await prisma.kegiatan.update({
            where: { id: parseInt(id) },
            data: {
                nama_kegiatan,
                tanggal: new Date(tanggal),
                waktu_mulai: timeStart,
                waktu_selesai: timeEnd,
                lokasi,
                deskripsi,
                id_kelas: id_kelas ? parseInt(id_kelas) : null,
                id_kamar: id_kamar ? parseInt(id_kamar) : null,
            }
        });

        res.json({ success: true, message: 'Kegiatan berhasil diperbarui!' });
    } catch (err) {
        console.error("Error updateKegiatan:", err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui kegiatan' });
    }
};
