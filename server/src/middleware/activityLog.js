const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const activityLog = (req, res, next) => {
    res.on('finish', async () => {
        
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
            try {
                const urlParts = req.originalUrl.split('?')[0].split('/');
                
                const role_user = req.user?.role || urlParts[2] || 'Sistem';
                const entitas = urlParts[3] || 'general'; 

                const possibleId = parseInt(urlParts[urlParts.length - 1]);
                const id_entitas = isNaN(possibleId) ? null : possibleId;

                let aksi = 'UNKNOWN';
                if (req.method === 'POST') aksi = 'CREATE';
                if (req.method === 'PUT') aksi = 'UPDATE';
                if (req.method === 'DELETE') aksi = 'DELETE';

                let payloadData = null;
                if (req.method !== 'DELETE' && req.body) {
                    const { password, ...safeBody } = req.body;
                    payloadData = safeBody;
                }

                await prisma.activity_log.create({
                    data: {
                        id_user: req.user?.id || null,
                        role_user: role_user,
                        aksi: aksi,
                        entitas: entitas,
                        id_entitas: id_entitas,
                        keterangan: `${req.user?.nama} melakukan ${aksi} pada data ${entitas}`,
                        data: payloadData
                    }
                });

            } catch (error) {
                console.error(' [!] Gagal mencatat Activity Log:', error.message);
            }
        }
    });

    next();
};

module.exports = activityLog;