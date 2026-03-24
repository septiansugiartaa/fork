// File: src/pages/pimpinan/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import api from "../../config/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Activity, DollarSign, AlertCircle, Star, Loader2, Printer } from "lucide-react";

// 1. IMPORT FUNGSI GENERATOR PDF
import { PdfLaporanPimpinan } from "../../components/PdfLaporanPimpinan";

export default function PimpinanDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // 2. REFERENSI ELEMEN CHART UNTUK DIFOTO PDF NANTI
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);

  const KESEHATAN_COLORS = {
    "Bukan Scabies": "#10B981", 
    "Kemungkinan Scabies": "#F59E0B", 
    "Scabies": "#EF4444", 
    "Perlu Evaluasi Lebih Lanjut": "#6B7280", 
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/pimpinan/dashboard");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Gagal load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR", minimumFractionDigits: 0,
    }).format(angka);
  };

  // 3. HANDLER KLIK TOMBOL CETAK
  const handlePrint = async () => {
    setIsExporting(true);
    try {
      // Panggil fungsi dari file terpisah, passing data dan referensi chart-nya
      await PdfLaporanPimpinan(data, barChartRef, pieChartRef);
    } catch (error) {
      alert("Terjadi kesalahan saat menyusun dokumen cetak.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-500 font-medium">Memuat Laporan Eksekutif...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Eksekutif Pimpinan</h1>
          <p className="text-gray-500 text-sm mt-1">Ringkasan kondisi pesantren untuk pantauan harian.</p>
        </div>
        
        <button
          onClick={handlePrint}
          disabled={isExporting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
          {isExporting ? "Menyusun Dokumen..." : "Cetak ke PDF"}
        </button>
      </div>

      <div className="space-y-6">
        {/* KARTU STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pemasukan Bulanan</p>
              <h3 className="text-xl font-bold text-gray-800">{formatRupiah(data.keuangan.total_pendapatan)}</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Pengaduan</p>
              <h3 className="text-xl font-bold text-gray-800">{data.kedisiplinan.total_aduan} Laporan</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><Star size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Indeks Kepuasan</p>
              <h3 className="text-xl font-bold text-gray-800">{data.kepuasan.rata_rata} / 5.0</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl"><Activity size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Tunggakan SPP</p>
              <h3 className="text-xl font-bold text-red-600">{data.keuangan.persentase_tunggakan}% Santri</h3>
            </div>
          </div>
        </div>

        {/* GRAFIK DENGAN REF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Sebaran Penyakit Kulit (Scabies)</h2>
            <p className="text-xs text-gray-500 mb-4">Hasil rekapitulasi screening kesehatan Timkes</p>
            {data.kesehatan && data.kesehatan.length > 0 ? (
              // 4. PASANG REF PIE CHART
              <div className="h-64 w-full relative" ref={pieChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.kesehatan} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="name">
                      {data.kesehatan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={KESEHATAN_COLORS[entry.name] || "#CBD5E1"} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <p className="text-sm text-gray-400">Belum ada data screening</p>
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Pendapatan Pondok</h2>
            <p className="text-xs text-gray-500 mb-4">Pembayaran 6 bulan terakhir</p>
            {/* 5. PASANG REF BAR CHART (Background putih dipasang agar saat difoto hasilnya tidak transparan) */}
            <div className="h-64 bg-white" ref={barChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.keuangan.grafik_bulanan}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                  <YAxis tickFormatter={(val) => `Rp ${val / 1000000}Jt`} axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                  <RechartsTooltip formatter={(value) => formatRupiah(value)} />
                  <Bar dataKey="pendapatan" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PROGRESS BAR & RATING KOTAK BAWAH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Riwayat Pengaduan</h2>
            <p className="text-xs text-gray-500 mb-6">Pengaduan oleh Ustadz kepada Wali Terkait Santri</p>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Laporan Selesai</span>
                  <span className="font-bold text-green-600">{data.kedisiplinan.selesai}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${data.kedisiplinan.total_aduan ? (data.kedisiplinan.selesai / data.kedisiplinan.total_aduan) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700">Laporan Aktif (Belum Ditangani)</span>
                  <span className="font-bold text-orange-500">{data.kedisiplinan.aktif}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-orange-400 h-3 rounded-full" style={{ width: `${data.kedisiplinan.total_aduan ? (data.kedisiplinan.aktif / data.kedisiplinan.total_aduan) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
            <Star size={100} className="absolute -right-5 -top-5 opacity-10" />
            <Star size={80} className="absolute -left-5 -bottom-5 opacity-10" />
            <h2 className="text-xl font-bold mb-2 z-10">Tingkat Kepuasan Santri</h2>
            <p className="text-green-100 text-sm mb-6 z-10 max-w-sm">Evaluasi kualitas layanan dan kegiatan pondok berdasarkan feedback aplikasi.</p>
            <div className="flex items-baseline gap-2 z-10">
              <span className="text-6xl font-black">{data.kepuasan.rata_rata}</span>
              <span className="text-xl font-medium text-green-200">/ 5.0</span>
            </div>
            <div className="mt-4 flex items-center gap-1 z-10">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={24} className={i < Math.round(data.kepuasan.rata_rata) ? "text-yellow-400 fill-yellow-400" : "text-green-400/50 fill-green-400/50"} />
              ))}
            </div>
            <p className="text-sm mt-3 font-medium bg-white/20 px-4 py-1.5 rounded-full z-10">Dari Total {data.kepuasan.total_ulasan} Ulasan</p>
          </div>
        </div>
      </div>

    </div>
  );
}