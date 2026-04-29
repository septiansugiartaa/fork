import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../config/api";

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

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const diagnosisTone = (diagnosis) => {
  if (diagnosis === "Scabies") return "bg-red-50 text-red-700 border-red-100";
  if (diagnosis === "Kemungkinan_Scabies") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-orange-50 text-orange-700 border-orange-100";
};

export default function TimkesDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/timkesehatan/dashboard/stats");
        setDashboard(data?.data || null);
      } catch (error) {
        console.error("Gagal memuat dashboard timkes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const kpi = dashboard?.kpi || {};
  const urgent = dashboard?.urgent || {};
  const monthlyChart = dashboard?.charts?.monthly || [];
  const yearlyChart = dashboard?.charts?.yearly || [];
  const coveragePercent = useMemo(() => {
    const total = kpi.totalSantri || 0;
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round(((total - (kpi.notScreened30Days || 0)) / total) * 100)));
  }, [kpi.notScreened30Days, kpi.totalSantri]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
        <p className="font-semibold text-gray-800">Dashboard belum bisa dimuat.</p>
        <p className="text-sm text-gray-500 mt-1">Coba muat ulang halaman atau cek koneksi server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">Panel Analitik Tim Kesehatan</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Selamat datang, {dashboard.timkes?.nama || "Tim Kesehatan"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prioritas layanan, kasus scabies, observasi, dan konsultasi per {formatDate(dashboard.generatedAt)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={<ClipboardList size={16} />} label="Screening" onClick={() => navigate("daftarSantriScreening")} />
          <ActionButton icon={<CalendarCheck size={16} />} label="Observasi" onClick={() => navigate("daftarSantriObservasi")} />
          <ActionButton icon={<MessageCircle size={16} />} label="Konsultasi" onClick={() => navigate("konsultasi")} />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Kasus Berisiko Bulan Ini"
          value={kpi.highRiskThisMonth}
          detail={`${formatNumber(kpi.scabiesThisMonth)} terkonfirmasi scabies`}
          icon={<ShieldAlert size={20} />}
          tone="red"
          urgent={kpi.highRiskThisMonth > 0}
        />
        <MetricCard
          title="Belum Screening 30 Hari"
          value={kpi.notScreened30Days}
          detail={`${coveragePercent}% santri tercakup`}
          icon={<Users size={20} />}
          tone="amber"
          urgent={kpi.notScreened30Days > 0}
        />
        <MetricCard
          title="Konsultasi Aktif"
          value={kpi.activeConsultations}
          detail={`${formatNumber(kpi.waitingConsultations)} menunggu, ${formatNumber(kpi.unreadConsultations)} pesan belum dibaca`}
          icon={<MessageCircle size={20} />}
          tone="blue"
          urgent={kpi.waitingConsultations > 0 || kpi.unreadConsultations > 0}
        />
        <MetricCard
          title="Pengajuan Materi"
          value={kpi.pendingPengajuanMateri}
          detail="Menunggu tinjauan timkes"
          icon={<BookOpenCheck size={20} />}
          tone="emerald"
          urgent={kpi.pendingPengajuanMateri > 0}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                Tren Bulanan Tahun Ini
              </h2>
              <p className="text-xs text-gray-500 mt-1">Screening, observasi, dan kasus scabies per bulan.</p>
            </div>
          </div>
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChart} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="screeningFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="observasiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="screening" name="Screening" stroke="#16a34a" strokeWidth={2.5} fill="url(#screeningFill)" />
                <Area type="monotone" dataKey="observasi" name="Observasi" stroke="#2563eb" strokeWidth={2.5} fill="url(#observasiFill)" />
                <Line type="monotone" dataKey="scabies" name="Scabies" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: "Screening", color: "#16a34a" },
              { label: "Observasi", color: "#2563eb" },
              { label: "Scabies", color: "#dc2626" },
            ]}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-600" />
            Aktivitas Hari Ini
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-5">Ringkasan tindakan operasional harian.</p>
          <div className="space-y-3">
            <ActivityRow label="Screening hari ini" value={kpi.screeningToday} tone="green" />
            <ActivityRow label="Observasi hari ini" value={kpi.observasiToday} tone="blue" />
            <ActivityRow label="Screening bulan ini" value={kpi.screeningThisMonth} tone="gray" />
            <ActivityRow label="Observasi bulan ini" value={kpi.observasiThisMonth} tone="gray" />
          </div>
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Cakupan screening 30 hari</span>
              <span className="font-bold text-gray-800">{coveragePercent}%</span>
            </div>
            <div className="h-2.5 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-green-600 rounded-full" style={{ width: `${coveragePercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            Tren Tahunan
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-5">Perbandingan screening, observasi, dan kasus berisiko lima tahun terakhir.</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyChart} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="screening" name="Screening" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="observasi" name="Observasi" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="kasusBerisiko" name="Kasus Berisiko" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: "Screening", color: "#16a34a" },
              { label: "Observasi", color: "#2563eb" },
              { label: "Kasus Berisiko", color: "#f97316" },
            ]}
          />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Clock3 size={18} className="text-orange-600" />
            Konsultasi Aktif
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">Room yang perlu dipantau oleh timkes.</p>
          <div className="space-y-3">
            {(urgent.activeRooms || []).length > 0 ? (
              urgent.activeRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => navigate(`konsultasi`)}
                  className="w-full text-left rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-800 truncate">{room.santri?.nama}</p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${room.status === "active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {room.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{room.last_message}</p>
                  <p className="text-[11px] text-gray-400 mt-2">Update {formatDateTime(room.updated_at)}</p>
                </button>
              ))
            ) : (
              <EmptyState icon={<MessageCircle size={28} />} text="Tidak ada konsultasi aktif." />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PriorityPanel
          title="Kasus Screening Prioritas"
          description="Santri dengan diagnosis scabies atau perlu evaluasi lebih lanjut."
          icon={<ShieldAlert size={18} className="text-red-600" />}
          emptyText="Belum ada kasus screening berisiko."
        >
          {(urgent.highRiskScreenings || []).map((item) => (
            <PriorityItem key={item.id}>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{item.santri?.nama}</p>
                <p className="text-xs text-gray-500 mt-1">{item.santri?.kelas} - {item.santri?.kamar}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`inline-flex border text-xs font-bold px-2.5 py-1 rounded-full ${diagnosisTone(item.diagnosa)}`}>
                  {item.diagnosa_label}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(item.tanggal)}</p>
              </div>
            </PriorityItem>
          ))}
        </PriorityPanel>

        <PriorityPanel
          title="Observasi Skor Rendah"
          description="Observasi kebersihan dengan skor 3 ke bawah."
          icon={<FileText size={18} className="text-amber-600" />}
          emptyText="Tidak ada observasi skor rendah."
        >
          {(urgent.lowScoreObservations || []).map((item) => (
            <PriorityItem key={item.id}>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 truncate">{item.santri?.nama}</p>
                <p className="text-xs text-gray-500 mt-1">{item.santri?.kelas} - {item.santri?.kamar}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex border border-amber-100 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  Skor {item.skor_diperoleh}
                </span>
                <p className="text-[11px] text-gray-400 mt-1">{formatDate(item.tanggal)}</p>
              </div>
            </PriorityItem>
          ))}
        </PriorityPanel>
      </section>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ title, value, detail, icon, tone, urgent }) {
  const tones = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${urgent ? "border-red-100" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div>
        {urgent && <span className="text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-700 px-2 py-1 rounded-full">Prioritas</span>}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-4">{title}</p>
      <h2 className="text-3xl font-black text-gray-900 mt-1">{formatNumber(value)}</h2>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

function ActivityRow({ label, value, tone }) {
  const tones = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={`min-w-10 text-center rounded-lg px-2.5 py-1 text-sm font-black ${tones[tone]}`}>{formatNumber(value)}</span>
    </div>
  );
}

function PriorityPanel({ title, description, icon, children, emptyText }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {hasChildren ? children : <EmptyState icon={<ClipboardList size={28} />} text={emptyText} />}
      </div>
    </div>
  );
}

function PriorityItem({ children }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition">
      {children}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <div className="text-gray-300 flex justify-center mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{text}</p>
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

function ChartTooltip({ active, payload, label }) {
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
