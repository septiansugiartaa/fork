const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {verifyToken} = require('../src/middleware/verifyToken');
const activityLog = require('../src/middleware/activityLog');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/foto-profil', express.static(path.join(__dirname, '../public/uploads/profil')));
app.use('/payments', express.static(path.join(__dirname, '../public/uploads/payments')));

app.get("/api", (req, res) => {
  res.send("PPDNY");
});

app.use('/api/auth', require('./routes/authRoutes'));

app.use(verifyToken);

app.use('/api/santri/notifications', require('./routes/santri/notificationRoutes'));
app.use('/api/orangtua/notifications', require('./routes/orangtua/notificationRoutes'));
app.use('/api/ustadz/notifications', require('./routes/ustadz/notificationRoutes'));

app.use(activityLog);

app.use('/api/santri', require('./routes/santri/dashboardRoutes'));
app.use('/api/santri/profile', require('./routes/santri/pendataanRoutes'));
app.use('/api/santri/keuangan', require('./routes/santri/keuanganRoutes'));
app.use('/api/santri/kegiatan', require('./routes/santri/kegiatanRoutes'));
app.use('/api/santri/pengaduan', require('./routes/santri/pengaduanRoutes'));
app.use('/api/santri/layanan', require('./routes/santri/layananRoutes'));
app.use('/api/santri/layanan/riwayat', require('./routes/santri/riwayatLayananRoutes'));

app.use('/api/global/viewMateri', require('./routes/viewMateriRoutes'));
app.use('/api/global/manageMateri', require('./routes/manageMateriRoutes'));
app.use('/api/global/faq', require('./routes/faqRoutes'));

app.use('/api/pengurus/dashboard', require('./routes/pengurus/dashboardRoutes'));
app.use('/api/pengurus/santri', require('./routes/pengurus/santriRoutes'));
app.use('/api/pengurus/orangtua', require('./routes/pengurus/orangtuaRoutes'));
app.use('/api/pengurus/ustadz', require('./routes/pengurus/ustadzRoutes'));
app.use('/api/pengurus/kelas', require('./routes/pengurus/kelasRoutes'));
app.use('/api/pengurus/kamar', require('./routes/pengurus/kamarRoutes'));
app.use('/api/pengurus/penempatan-kelas', require('./routes/pengurus/assignKelasRoutes'));
app.use('/api/pengurus/penempatan-kamar', require('./routes/pengurus/assignKamarRoutes'));
app.use('/api/pengurus/jenis-layanan', require('./routes/pengurus/jenisLayananRoutes'));
app.use('/api/pengurus/jenis-tagihan', require('./routes/pengurus/jenisTagihanRoutes'));
app.use('/api/pengurus/riwayat-layanan', require('./routes/pengurus/riwayatLayananRoutes'));
app.use('/api/pengurus/kegiatan', require('./routes/pengurus/kegiatanRoutes'));
app.use('/api/pengurus/keuangan', require('./routes/pengurus/keuanganRoutes'));

app.use('/api/orangtua/dashboard', require('./routes/orangtua/dashboardRoutes'));
app.use('/api/orangtua/profile', require('./routes/orangtua/pendataanRoutes'));
app.use('/api/orangtua/kegiatan', require('./routes/orangtua/kegiatanRoutes'));
app.use('/api/orangtua/keuangan', require('./routes/orangtua/keuanganRoutes'));
app.use('/api/orangtua/pengaduan', require('./routes/orangtua/pengaduanRoutes'));

app.use('/api/ustadz/dashboard', require('./routes/ustadz/dashboardRoutes'));
app.use('/api/ustadz/profile', require('./routes/ustadz/pendataanRoutes'));
app.use('/api/ustadz/kegiatan', require('./routes/ustadz/kegiatanRoutes'));
app.use('/api/ustadz/santri', require('./routes/ustadz/santriRoutes'));
app.use('/api/ustadz/pengaduan', require('./routes/ustadz/pengaduanRoutes'));

app.use('/api/pimpinan/dashboard', require('./routes/pimpinan/dashboardRoutes'));
app.use('/api/pimpinan/santri', require('./routes/pimpinan/santriRoutes'));
app.use('/api/pimpinan/ustadz', require('./routes/pimpinan/ustadzRoutes'));
app.use('/api/pimpinan/pengaduan', require('./routes/pimpinan/pengaduanRoutes'));
app.use('/api/pimpinan/keuangan', require('./routes/pimpinan/keuanganRoutes'));
app.use('/api/pimpinan/feedback', require('./routes/pimpinan/feedbackRoutes'));

app.use('/api/admin/dashboard', require('./routes/admin/dashboardRoutes'));
app.use('/api/admin/staf', require('./routes/admin/stafRoutes'));
app.use('/api/admin/santri', require('./routes/admin/santriRoutes'));
app.use('/api/admin/orangtua', require('./routes/admin/orangtuaRoutes'));
app.use('/api/admin/ustadz', require('./routes/admin/ustadzRoutes'));
app.use('/api/admin/kelas', require('./routes/admin/kelasRoutes'));
app.use('/api/admin/kamar', require('./routes/admin/kamarRoutes'));
app.use('/api/admin/penempatan-kelas', require('./routes/admin/assignKelasRoutes'));
app.use('/api/admin/penempatan-kamar', require('./routes/admin/assignKamarRoutes'));
app.use('/api/admin/jenis-layanan', require('./routes/admin/jenisLayananRoutes'));
app.use('/api/admin/jenis-tagihan', require('./routes/admin/jenisTagihanRoutes'));
app.use('/api/admin/pengaduan', require('./routes/admin/pengaduanRoutes'));
app.use('/api/admin/kegiatan', require('./routes/admin/kegiatanRoutes'));
app.use('/api/admin/riwayat-layanan', require('./routes/admin/riwayatLayananRoutes'));
app.use('/api/admin/keuangan', require('./routes/admin/keuanganRoutes'));
app.use('/api/admin/feedback', require('./routes/admin/feedbackRoutes'));
app.use('/api/admin/log', require('./routes/admin/logRoutes'));
app.use('/api/admin/screening', require('./routes/admin/screeningRoutes'));

app.use('/api/timkesehatan/screening', require('./routes/timkesehatan/screeningRoutes'));
app.use('/api/timkesehatan/absensi', require('./routes/timkesehatan/absensiRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;