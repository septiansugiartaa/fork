const prisma = require('../config/prisma');

// Field yang BOLEH dicatat ke activity log.
// Pendekatan allowlist jauh lebih aman dari blocklist (hanya buang 'password'):
// data medis, NIK, info keuangan, dan field sensitif lain otomatis terproteksi.
const SAFE_FIELDS = [
    'id', 'nama', 'nip', 'role', 'status', 'aksi',
    'kelas', 'kamar', 'tahun_ajaran', 'tanggal', 'nominal',
    'jenis_layanan', 'jenis_tagihan', 'nama_tagihan', 'nama_kegiatan',
    'hubungan', 'target_santri', 'id_santri', 'id_kelas', 'id_kamar',
    'id_jenis_layanan', 'id_jenis_tagihan', 'catatan', 'keterangan',
];

/**
 * Saring body request hanya menyisakan field yang ada di SAFE_FIELDS.
 * Semua field sensitif (password, no_hp, alamat, email, data medis, dsb.)
 * otomatis tidak tercatat.
 */
const sanitizePayload = (body) => {
    if (!body || typeof body !== 'object') return null;
    const safe = {};
    for (const key of SAFE_FIELDS) {
        if (key in body) safe[key] = body[key];
    }
    return Object.keys(safe).length > 0 ? safe : null;
};

const activityLog = (req, res, next) => {
    res.on('finish', async () => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
            try {
                const urlParts = req.originalUrl.split('?')[0].split('/');
                const role_user = req.user?.role || urlParts[2] || 'Sistem';
                const entitas   = urlParts[3] || 'general';

                const possibleId = parseInt(urlParts[urlParts.length - 1]);
                const id_entitas = isNaN(possibleId) ? null : possibleId;

                const aksiMap = { POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE' };
                const aksi = aksiMap[req.method] || 'UNKNOWN';

                const payloadData = req.method !== 'DELETE' ? sanitizePayload(req.body) : null;

                await prisma.activity_log.create({
                    data: {
                        id_user:    req.user?.id   || null,
                        role_user,
                        aksi,
                        entitas,
                        id_entitas,
                        keterangan: `${req.user?.nama || 'Sistem'} melakukan ${aksi} pada data ${entitas}`,
                        data:       payloadData,
                    },
                });
            } catch (error) {
                // Log error ke console tapi JANGAN throw — jangan sampai
                // kegagalan pencatatan log mengganggu response yang sudah dikirim.
                console.error('[!] Gagal mencatat Activity Log:', error.message);
            }
        }
    });

    next();
};

module.exports = activityLog;
