const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

exports.getDaftarSantri = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { search, filter, id_sub } = req.query;

        // Kelas yang diwali
        const kelasBinaan = await prisma.kelas.findMany({
            where: { id_wali: userId, is_active: true },
            select: { id: true, kelas: true }
        });

        // Kamar yang diwali
        const kamarBinaan = await prisma.kamar.findMany({
            where: { id_wali: userId, is_active: true },
            select: { id: true, kamar: true }
        });

        const isWaliKelas = kelasBinaan.length > 0;
        const isWaliKamar = kamarBinaan.length > 0;
        const idKelasBinaan = kelasBinaan.map(k => k.id);
        const idKamarBinaan = kamarBinaan.map(k => k.id);

        let whereCondition = {
            is_active: true,
            user_role: { some: { role: { role: 'Santri' } } }
        };

        if (search) {
            whereCondition.OR = [
                { nama: { contains: search } },
                { nip: { contains: search } }
            ];
        }

        if (filter === 'kelasku') {
            if (id_sub && id_sub !== 'all') {
                whereCondition.kelas_santri = { some: { id_kelas: parseInt(id_sub), is_active: true } };
            } else if (isWaliKelas) {
                whereCondition.kelas_santri = { some: { id_kelas: { in: idKelasBinaan }, is_active: true } };
            } else {
                // Tidak jadi wali kelas, return empty
                return res.json({
                    success: true,
                    meta: { is_wali_kelas: false, is_wali_kamar: isWaliKamar, kelas_binaan: kelasBinaan, kamar_binaan: kamarBinaan },
                    data: []
                });
            }
        } else if (filter === 'kamarku') {
            if (id_sub && id_sub !== 'all') {
                whereCondition.kamar_santri = { some: { id_kamar: parseInt(id_sub), is_active: true } };
            } else if (isWaliKamar) {
                whereCondition.kamar_santri = { some: { id_kamar: { in: idKamarBinaan }, is_active: true } };
            } else {
                return res.json({
                    success: true,
                    meta: { is_wali_kelas: isWaliKelas, is_wali_kamar: false, kelas_binaan: kelasBinaan, kamar_binaan: kamarBinaan },
                    data: []
                });
            }
        }

        const santris = await prisma.users.findMany({
            where: whereCondition,
            orderBy: { nama: 'asc' },
            include: {
                kelas_santri: {
                    where: { is_active: true },
                    take: 1,
                    orderBy: { id: 'desc' },
                    include: { kelas: true }
                },
                kamar_santri: {
                    where: { is_active: true },
                    take: 1,
                    orderBy: { tanggal_masuk: 'desc' },
                    include: { kamar: true }
                },
                absensi: { select: { status: true } },
                orangtua_orangtua_id_santriTousers: {
                    where: { is_active: true },
                    include: { users_orangtua_id_orangtuaTousers: true }
                }
            }
        });

        const data = santris.map(s => {
            const totalAbsen = s.absensi.length;
            const totalHadir = s.absensi.filter(a => a.status === 'Hadir').length;
            const persentaseHadir = totalAbsen > 0 ? Math.round((totalHadir / totalAbsen) * 100) : 0;

            return {
                id: s.id,
                nip: s.nip || "-",
                nama: s.nama,
                foto_profil: s.foto_profil,
                no_hp: s.no_hp || "-",
                alamat: s.alamat || "-",
                kelas_aktif: s.kelas_santri[0]?.kelas?.kelas || "Belum ada kelas",
                kamar_aktif: s.kamar_santri[0]?.kamar?.kamar || "Belum ada kamar",
                kehadiran: persentaseHadir,
                kontak_orangtua: s.orangtua_orangtua_id_santriTousers?.map(ortu => {
                    const dataOrtu = ortu.users_orangtua_id_orangtuaTousers;
                    return {
                        nama: dataOrtu?.nama || "Tidak Diketahui",
                        hubungan: ortu.hubungan || "Orang Tua/Wali",
                        no_hp: dataOrtu?.no_hp || "-",
                        foto_profil: dataOrtu?.foto_profil || "-"
                    };
                }) || []
            };
        });

        res.json({
            success: true,
            meta: {
                is_wali_kelas: isWaliKelas,
                is_wali_kamar: isWaliKamar,
                kelas_binaan: kelasBinaan,
                kamar_binaan: kamarBinaan
            },
            data
        });

    } catch (err) {
        console.error("Error getDaftarSantri:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat daftar santri' });
    }
};

exports.getPengaduanByUstadz = async (req, res) => {
    try {
        const ustadzId = req.user.id;
        const santriId = parseInt(req.params.idSantri);

        const pengaduans = await prisma.pengaduan.findMany({
            where: { id_pelapor: ustadzId, id_santri: santriId, is_active: true },
            orderBy: { waktu_aduan: 'desc' }
        });

        const data = pengaduans.map(p => ({
            id: p.id,
            judul: p.judul || "Tanpa Judul",
            deskripsi: p.deskripsi,
            status: p.status,
            tanggal: formatDate(p.waktu_aduan)
        }));

        res.json({ success: true, data });

    } catch (err) {
        console.error("Error getPengaduanByUstadz:", err);
        res.status(500).json({ success: false, message: 'Gagal memuat riwayat pengaduan' });
    }
};
