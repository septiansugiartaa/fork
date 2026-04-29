import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  BarChart3,
  DollarSign,
  Download,
  Loader2,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";
import { PdfLaporanPimpinan } from "../../components/PdfLaporanPimpinan";
import {
  exportMonthlyScabiesPdf,
  exportYearlyScabiesPdf,
} from "../../components/PdfScabiesDashboard";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PimpinanDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingMonthlyScabies, setIsExportingMonthlyScabies] = useState(false);
  const [isExportingYearlyScabies, setIsExportingYearlyScabies] = useState(false);
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [showYearlyDetail, setShowYearlyDetail] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();

  const barChartRef = useRef(null);
  const scabiesMonthlyChartRef = useRef(null);
  const scabiesYearlyChartRef = useRef(null);

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

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka || 0);

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      await PdfLaporanPimpinan(data, barChartRef, scabiesMonthlyChartRef);
    } catch (error) {
      showAlert("error", "Terjadi kesalahan saat menyusun dokumen cetak.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMonthlyScabies = async () => {
    if (!data?.scabies_dashboard) return;

    setIsExportingMonthlyScabies(true);
    try {
      await exportMonthlyScabiesPdf({
        summary: data.scabies_dashboard.summary,
        chartData: data.scabies_dashboard.chart_bulanan,
        detail: data.scabies_dashboard.detail_bulanan,
        chartRef: scabiesMonthlyChartRef,
      });
    } catch (error) {
      console.error("Gagal export laporan bulanan scabies", error);
      showAlert("error", "Gagal mengekspor laporan bulanan scabies.");
    } finally {
      setIsExportingMonthlyScabies(false);
    }
  };

  const handleExportYearlyScabies = async () => {
    if (!data?.scabies_dashboard) return;

    setIsExportingYearlyScabies(true);
    try {
      await exportYearlyScabiesPdf({
        summary: data.scabies_dashboard.summary,
        chartData: data.scabies_dashboard.chart_tahunan,
        detail: data.scabies_dashboard.detail_tahunan,
        chartRef: scabiesYearlyChartRef,
      });
    } catch (error) {
      console.error("Gagal export laporan tahunan scabies", error);
      showAlert("error", "Gagal mengekspor laporan tahunan scabies.");
    } finally {
      setIsExportingYearlyScabies(false);
    }
  };

  const yearlyPriorityRows = useMemo(() => {
    const yearlyRows = data?.scabies_dashboard?.detail_tahunan || [];
    if (!yearlyRows.length) return [];

    const getTopRow = (key) =>
      [...yearlyRows].sort((a, b) => (b[key] || 0) - (a[key] || 0))[0];

    const highestScabies = getTopRow("terkena_scabies");
    const highestEvaluation = getTopRow("perlu_evaluasi");
    const safestYear = getTopRow("tidak_terpapar");

    return [
      {
        indikator: "Kasus Scabies Tertinggi",
        tahun: highestScabies?.year || "-",
        nilai: highestScabies?.terkena_scabies || 0,
        keterangan: "Perlu evaluasi tindak lanjut dan pola penularan.",
      },
      {
        indikator: "Tahun Evaluasi Tertinggi",
        tahun: highestEvaluation?.year || "-",
        nilai: highestEvaluation?.perlu_evaluasi || 0,
        keterangan: "Kasus yang butuh pemantauan lanjutan paling banyak.",
      },
      {
        indikator: "Tahun Paling Aman",
        tahun: safestYear?.year || "-",
        nilai: safestYear?.tidak_terpapar || 0,
        keterangan: "Jumlah santri dengan hasil Bukan Scabies paling tinggi.",
      },
    ];
  }, [data?.scabies_dashboard?.detail_tahunan]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-500 font-medium">Memuat Laporan Eksekutif...</p>
      </div>
    );
  }

  const scabiesDashboard = data.scabies_dashboard || {};
  const scabiesSummary = scabiesDashboard.summary || {};
  const monthlyScabies = scabiesDashboard.chart_bulanan || [];
  const yearlyScabies = scabiesDashboard.chart_tahunan || [];
  const monthlyDetail = scabiesDashboard.detail_bulanan || {};
  const yearlyDetail = scabiesDashboard.detail_tahunan || [];

  return (
    <div className="bg-gray-50 min-h-screen space-y-7">
      <AlertToast message={message} onClose={clearAlert} />

      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pemasukan Bulanan"
          value={formatRupiah(data.keuangan.total_pendapatan)}
          icon={<DollarSign size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Pengaduan"
          value={`${formatNumber(data.kedisiplinan.total_aduan)} Laporan`}
          icon={<AlertCircle size={24} />}
          color="orange"
        />
        <StatCard
          title="Indeks Kepuasan"
          value={`${data.kepuasan.rata_rata} / 5.0`}
          icon={<Star size={24} />}
          color="yellow"
        />
        <StatCard
          title="Tunggakan SPP"
          value={`${data.keuangan.persentase_tunggakan}% Santri`}
          icon={<Activity size={24} />}
          color="red"
          valueClassName="text-red-600"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Pendapatan Pondok</h2>
          <p className="text-xs text-gray-500 mb-4">Pembayaran 6 bulan terakhir</p>
          <div className="h-72 bg-white" ref={barChartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.keuangan.grafik_bulanan} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                <YAxis tickFormatter={(val) => `Rp ${val / 1000000}Jt`} axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => formatRupiah(value)} />
                <Bar dataKey="pendapatan" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Riwayat Pengaduan</h2>
          <p className="text-xs text-gray-500 mb-6">Pengaduan oleh ustadz kepada wali terkait santri.</p>
          <div className="space-y-5">
            <ProgressRow
              label="Laporan Selesai"
              value={data.kedisiplinan.selesai}
              total={data.kedisiplinan.total_aduan}
              barClassName="bg-green-500"
              valueClassName="text-green-600"
            />
            <ProgressRow
              label="Laporan Aktif (Belum Ditangani)"
              value={data.kedisiplinan.aktif}
              total={data.kedisiplinan.total_aduan}
              barClassName="bg-orange-400"
              valueClassName="text-orange-500"
            />
          </div>
        </section>
      </div>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-yellow-700">Dashboard Scabies</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Analitik Screening Terakhir Santri</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chart dihitung dari screening terakhir setiap santri, sehingga ringkasan tidak menggandakan riwayat lama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScabiesSummaryCard
            title="Total Screening Terakhir"
            value={scabiesSummary.total_screening_terakhir}
            detail="Santri dengan riwayat screening"
            icon={<BarChart3 size={20} />}
            tone="blue"
          />
          <ScabiesSummaryCard
            title="Terkena Scabies"
            value={scabiesSummary.terkena_scabies}
            detail="Diagnosis terakhir Scabies"
            icon={<ShieldAlert size={20} />}
            tone="red"
          />
          <ScabiesSummaryCard
            title="Tidak Terpapar"
            value={scabiesSummary.tidak_terpapar}
            detail="Diagnosis terakhir Bukan Scabies"
            icon={<ShieldCheck size={20} />}
            tone="green"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ScabiesChartCard
            title="Chart Bulanan Kasus Scabies"
            description="Distribusi diagnosis terakhir santri pada tahun berjalan."
            data={monthlyScabies}
            xKey="month"
            chartRef={scabiesMonthlyChartRef}
            onExport={handleExportMonthlyScabies}
            isExporting={isExportingMonthlyScabies}
            actionLabel="Lihat Selengkapnya"
            onAction={() => setShowMonthlyDetail(true)}
          />
          <ScabiesChartCard
            title="Chart Tahunan Kasus Scabies"
            description="Perbandingan diagnosis terakhir dalam lima tahun terakhir."
            data={yearlyScabies}
            xKey="year"
            chartRef={scabiesYearlyChartRef}
            onExport={handleExportYearlyScabies}
            isExporting={isExportingYearlyScabies}
            actionLabel="Lihat Selengkapnya"
            onAction={() => setShowYearlyDetail(true)}
          />
        </div>
      </section>

      {showMonthlyDetail && (
        <DetailModal
          title="Detail Chart Bulanan Kasus Scabies"
          subtitle="Tabel berikut dibagi berdasarkan status screening terakhir santri pada tahun berjalan."
          onClose={() => setShowMonthlyDetail(false)}
        >
          <div className="space-y-6">
            <StatusSection
              title="Status Scabies"
              rows={monthlyDetail.scabies || []}
              tone="red"
              onOpenSantri={(id) => navigate(`/pimpinan/daftarSantriScreening/${id}`)}
            />
            <StatusSection
              title="Status Kemungkinan Scabies / Evaluasi Lebih Lanjut"
              rows={monthlyDetail.evaluasi || []}
              tone="yellow"
              onOpenSantri={(id) => navigate(`/pimpinan/daftarSantriScreening/${id}`)}
            />
            <StatusSection
              title="Status Bukan Scabies"
              rows={monthlyDetail.bukan_scabies || []}
              tone="green"
              onOpenSantri={(id) => navigate(`/pimpinan/daftarSantriScreening/${id}`)}
            />
          </div>
        </DetailModal>
      )}

      {showYearlyDetail && (
        <DetailModal
          title="Rangkuman Tahunan Kasus Scabies"
          subtitle="Ringkasan tahunan untuk membaca perubahan pola kasus, area evaluasi, dan capaian hasil aman."
          onClose={() => setShowYearlyDetail(false)}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {yearlyPriorityRows.map((item) => (
                <div key={item.indikator} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{item.indikator}</p>
                  <h4 className="text-2xl font-black text-gray-900 mt-2">{item.tahun}</h4>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{formatNumber(item.nilai)} santri</p>
                  <p className="text-xs text-gray-500 mt-2">{item.keterangan}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <h3 className="font-bold text-gray-900">Tabel Rekap Tahunan Screening Terakhir</h3>
                <p className="text-xs text-gray-500 mt-1">Dipakai untuk membaca beban kasus dan tren keamanan per tahun.</p>
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">No</th>
                      <th className="px-4 py-3 text-left">Tahun</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Scabies</th>
                      <th className="px-4 py-3 text-right">Evaluasi</th>
                      <th className="px-4 py-3 text-right">Bukan Scabies</th>
                      <th className="px-4 py-3 text-right">Rasio Scabies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {yearlyDetail.map((row, index) => {
                      const ratio = row.total ? `${Math.round((row.terkena_scabies / row.total) * 100)}%` : "0%";
                      return (
                        <tr key={row.year} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{row.year}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(row.total)}</td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatNumber(row.terkena_scabies)}</td>
                          <td className="px-4 py-3 text-right text-amber-600 font-semibold">{formatNumber(row.perlu_evaluasi)}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatNumber(row.tidak_terpapar)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{ratio}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <h3 className="font-bold text-gray-900">Tabel Prioritas Tahunan</h3>
                <p className="text-xs text-gray-500 mt-1">Indikator cepat untuk membaca tahun yang perlu perhatian pimpinan.</p>
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">No</th>
                      <th className="px-4 py-3 text-left">Indikator</th>
                      <th className="px-4 py-3 text-left">Tahun</th>
                      <th className="px-4 py-3 text-right">Nilai</th>
                      <th className="px-4 py-3 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {yearlyPriorityRows.map((row, index) => (
                      <tr key={row.indikator} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{row.indikator}</td>
                        <td className="px-4 py-3">{row.tahun}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatNumber(row.nilai)}</td>
                        <td className="px-4 py-3 text-gray-600">{row.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, valueClassName = "text-gray-800" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-yellow-50 text-yellow-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <h3 className={`text-xl font-bold truncate ${valueClassName}`}>{value}</h3>
      </div>
    </div>
  );
}

function ScabiesSummaryCard({ title, value, detail, icon, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1">{formatNumber(value)}</h3>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

function ScabiesChartCard({
  title,
  description,
  data,
  xKey,
  chartRef,
  actionLabel,
  onAction,
  onExport,
  isExporting,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? "Mengekspor..." : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={onAction}
            className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {actionLabel}
          </button>
        </div>
      </div>
      <div className="h-[300px]" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <RechartsTooltip content={<ScabiesTooltip />} />
            <Line
              type="monotone"
              dataKey="terkena_scabies"
              name="Terkena Scabies"
              stroke="#dc2626"
              strokeWidth={3}
              dot={{ r: 3, fill: "#dc2626", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="tidak_terpapar"
              name="Tidak Terpapar"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: "Terkena Scabies", color: "#dc2626" },
          { label: "Tidak Terpapar Scabies", color: "#16a34a" },
        ]}
      />
    </div>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      {items.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <span className="whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ScabiesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
      <p className="text-xs font-bold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-6 text-xs">
            <span className="font-medium" style={{ color: item.color }}>{item.name}</span>
            <span className="font-bold text-gray-800">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, barClassName, valueClassName }) {
  const percent = total ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className={`font-bold ${valueClassName}`}>{formatNumber(value)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className={`h-3 rounded-full ${barClassName}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function DetailModal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 sm:py-10">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusSection({ title, rows, tone, onOpenSantri }) {
  const themes = {
    red: "bg-red-50 text-red-700 border-red-100",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
    green: "bg-green-50 text-green-700 border-green-100",
  };

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
      <div className={`px-5 py-4 border-b ${themes[tone]}`}>
        <h3 className="font-bold">{title}</h3>
        <p className="text-xs mt-1">Total {formatNumber(rows.length)} santri</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">No</th>
              <th className="px-4 py-3 text-left">Nama Santri</th>
              <th className="px-4 py-3 text-left">Tanggal Screening Terakhir</th>
              <th className="px-4 py-3 text-left">Kamar</th>
              <th className="px-4 py-3 text-left">Kelas</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={`${row.id_santri}-${row.tanggal}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{row.nama}</td>
                  <td className="px-4 py-3">{formatDate(row.tanggal)}</td>
                  <td className="px-4 py-3">{row.kamar}</td>
                  <td className="px-4 py-3">{row.kelas}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenSantri(row.id_santri)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Buka Portal
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data untuk kategori ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
