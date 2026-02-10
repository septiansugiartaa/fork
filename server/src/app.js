const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get("/", (req, res) => {
  res.send("PPDNY");
});

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/santri', require('./routes/santri/dashboardRoutes'));
app.use('/api/santri/profile', require('./routes/santri/pendataanRoutes'));
app.use('/api/santri/keuangan', require('./routes/santri/keuanganRoutes'));
app.use('/api/santri/kegiatan', require('./routes/santri/kegiatanRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;