const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

const { verifyToken } = require('./middleware/verifyToken');
const activityLog = require('./middleware/activityLog');

dotenv.config();

const konsultasiService = require('./controllers/shared/konsultasiService');

const app = express();

// 1. SECURITY HEADERS 
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// 2. CORS 
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`));
  },
  credentials: true,
}));

// 3. RATE LIMITING 
// Rate limit auth
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

// Rate limit umum
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi sebentar.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// 4. BODY PARSER 
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// 5. PUBLIC ROUTES (tidak perlu token) 
app.get('/api', (req, res) => res.json({ success: true, message: 'PPDNY API' }));

app.use('/api/public', require('./routes/public/publicRoutes'));
app.use('/api/ppdb/public', require('./routes/ppdb/publicPpdbRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/foto-profil', express.static(path.join(__dirname, '../public/uploads/profil')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 6. PROTECTED ROUTES 
app.use(verifyToken);

app.use('/payments', express.static(path.join(__dirname, '../public/uploads/payments')));

app.use(activityLog);

// Notifications
app.use('/api/santri/notifications', require('./routes/santri/notificationRoutes'));
app.use('/api/orangtua/notifications', require('./routes/orangtua/notificationRoutes'));
app.use('/api/ustadz/notifications', require('./routes/ustadz/notificationRoutes'));

// Santri
app.use('/api/santri', require('./routes/santri/dashboardRoutes'));
app.use('/api/santri/profile', require('./routes/santri/pendataanRoutes'));
app.use('/api/santri/keuangan', require('./routes/santri/keuanganRoutes'));
app.use('/api/santri/kegiatan', require('./routes/santri/kegiatanRoutes'));
app.use('/api/santri/pengaduan', require('./routes/santri/pengaduanRoutes'));
app.use('/api/santri/layanan', require('./routes/santri/layananRoutes'));
app.use('/api/santri/layanan/riwayat', require('./routes/santri/riwayatLayananRoutes'));
app.use('/api/santri/konsultasi', require('./routes/santri/konsultasiRoutes'));

// Global
app.use('/api/global/viewMateri', require('./routes/viewMateriRoutes'));
app.use('/api/global/manageMateri', require('./routes/manageMateriRoutes'));
app.use('/api/global/faq', require('./routes/faqRoutes'));

// Pengurus
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

// Orang Tua
app.use('/api/orangtua/dashboard', require('./routes/orangtua/dashboardRoutes'));
app.use('/api/orangtua/profile', require('./routes/orangtua/pendataanRoutes'));
app.use('/api/orangtua/kegiatan', require('./routes/orangtua/kegiatanRoutes'));
app.use('/api/orangtua/keuangan', require('./routes/orangtua/keuanganRoutes'));
app.use('/api/orangtua/pengaduan', require('./routes/orangtua/pengaduanRoutes'));

// Ustadz
app.use('/api/ustadz/dashboard', require('./routes/ustadz/dashboardRoutes'));
app.use('/api/ustadz/profile', require('./routes/ustadz/pendataanRoutes'));
app.use('/api/ustadz/kegiatan', require('./routes/ustadz/kegiatanRoutes'));
app.use('/api/ustadz/santri', require('./routes/ustadz/santriRoutes'));
app.use('/api/ustadz/pengaduan', require('./routes/ustadz/pengaduanRoutes'));

// Pimpinan
app.use('/api/pimpinan/dashboard', require('./routes/pimpinan/dashboardRoutes'));
app.use('/api/pimpinan/santri', require('./routes/pimpinan/santriRoutes'));
app.use('/api/pimpinan/ustadz', require('./routes/pimpinan/ustadzRoutes'));
app.use('/api/pimpinan/pengaduan', require('./routes/pimpinan/pengaduanRoutes'));
app.use('/api/pimpinan/keuangan', require('./routes/pimpinan/keuanganRoutes'));
app.use('/api/pimpinan/feedback', require('./routes/pimpinan/feedbackRoutes'));
app.use('/api/pimpinan/observasi', require('./routes/pimpinan/observasiRoutes'));

// Admin
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
app.use('/api/admin/observasi', require('./routes/admin/observasiRoutes'));

// Tim Kesehatan
app.use('/api/timkesehatan/screening', require('./routes/timkesehatan/screeningRoutes'));
app.use('/api/timkesehatan/absensi', require('./routes/timkesehatan/absensiRoutes'));
app.use('/api/timkesehatan/observasi', require('./routes/timkesehatan/observasiRoutes'));
app.use('/api/timkesehatan/konsultasi', require('./routes/timkesehatan/konsultasiRoutes'));

// PPDB
app.use('/api/ppdb/admin', require('./routes/ppdb/adminPpdbRoutes'));
app.use('/api/ppdb/panitia',require('./routes/ppdb/panitiaPpdbRoutes'));

// 7. GLOBAL ERROR HANDLER 
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Ukuran file melebihi batas 5 MB.' });
  }

  if (err.message && err.message.startsWith('Format file')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
    ...(isDev && { detail: err.message }),
  });
});

// 8. START SERVER 
const PORT = process.env.PORT || 3000;

setInterval(async () => {
  try {
    await konsultasiService.autoCloseExpiredActiveRooms();
    await konsultasiService.autoCloseInactiveRooms();
  } catch (error) {
    console.error('Auto close konsultasi gagal:', error.message);
  }
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
