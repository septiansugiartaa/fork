const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get All Logs with Server-Side Search & Pagination
exports.getAllLogs = async (req, res) => {
    try {
        // Ambil parameter dari frontend
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const { search, aksi, role } = req.query;

        // Bangun kondisi query pencarian
        let whereClause = {};

        if (aksi && aksi !== 'Semua') whereClause.aksi = aksi;
        if (role && role !== 'Semua') whereClause.role_user = role;

        if (search) {
            whereClause.OR = [
                { keterangan: { contains: search } },
                { entitas: { contains: search } },
                { role_user: { contains: search } },
                { users: { nama: { contains: search } } }
            ];
        }

        // Jalankan count dan pencarian data secara paralel (transaction)
        const [totalRows, logs] = await prisma.$transaction([
            prisma.activity_log.count({ where: whereClause }),
            prisma.activity_log.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { users: { select: { nama: true } } }
            })
        ]);

        // Mapping agar rapi
        const formattedLogs = logs.map(log => ({
            id: log.id,
            nama_user: log.users?.nama || "Sistem / Anonim",
            role_user: log.role_user || "-",
            aksi: log.aksi || "-",
            entitas: log.entitas || "-",
            keterangan: log.keterangan || "-",
            created_at: log.created_at
        }));

        res.json({ 
            success: true, 
            data: formattedLogs,
            meta: {
                totalRows,
                totalPages: Math.ceil(totalRows / limit),
                currentPage: page
            }
        });
    } catch (error) {
        console.error("Error get all logs:", error);
        res.status(500).json({ success: false, message: "Gagal memuat log aktivitas" });
    }
};

// Route untuk mengambil list role yang unik (agar dropdown filter tetap jalan)
exports.getUniqueRoles = async (req, res) => {
    try {
        const rolesRaw = await prisma.activity_log.groupBy({
            by: ['role_user'],
            where: { role_user: { not: null } }
        });
        const roles = rolesRaw.map(r => r.role_user);
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};