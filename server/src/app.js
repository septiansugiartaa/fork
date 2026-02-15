const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const {verifyToken} = require('../src/middleware/verifyToken');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get("/", (req, res) => {
app.get("/api", (req, res) => {
  res.send("PPDNY");
});

// app.use(verifyToken);
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/santri', require('./routes/santri/dashboardRoutes'));
app.use('/api/santri/profile', require('./routes/santri/pendataanRoutes'));
app.use('/api/santri/keuangan', require('./routes/santri/keuanganRoutes'));
app.use('/api/santri/kegiatan', require('./routes/santri/kegiatanRoutes'));
app.use('/api/santri/pengaduan', require('./routes/santri/pengaduanRoutes'));
app.use('/api/santri/layanan', require('./routes/santri/layananRoutes'));
app.use('/api/santri/layanan/riwayat', require('./routes/santri/riwayatLayananRoutes'));

app.use('/api/pengurus/santri', require('./routes/pengurus/santriRoutes'));
app.use('/api/pengurus/ustadz', require('./routes/pengurus/ustadzRoutes'));
app.use('/api/pengurus/kelas', require('./routes/pengurus/kelasRoutes'));
app.use('/api/pengurus/kamar', require('./routes/pengurus/kamarRoutes'));
app.use('/api/pengurus/penempatan-kelas', require('./routes/pengurus/assignKelasRoutes'));
app.use('/api/pengurus/penempatan-kamar', require('./routes/pengurus/assignKamarRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;