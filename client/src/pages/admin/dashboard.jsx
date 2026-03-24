import React, { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Users,
  UserCog,
  Database,
  AlertTriangle,
  ShieldCheck,
  Info,
  BedDouble,
  BookOpen,
  List,
  Receipt,
  Loader2,
  Activity,
  Clock,
  UserMinus, 
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const capitalize = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showTooltipSantri, setShowTooltipSantri] = useState(false);
  const [showTooltipIncomplete, setShowTooltipIncomplete] = useState(false);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#64748b",
    "#ec4899",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/admin/dashboard/stats");
        if (res.data && res.data.chartDataRole) {
          res.data.chartDataRole = res.data.chartDataRole.map((item) => ({
            ...item,
            name: capitalize(item.name),
          }));
        }
        setData(res.data);
      } catch (err) {
        console.error(
          "Dashboard error:",
          err.response?.data?.message || err.message,
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  if (!data) return null;

  const { stats, chartDataRole, recentLogs = [] } = data;
  const isSystemHealthy =
    stats.systemHealth.orphanKamar === 0 &&
    stats.systemHealth.orphanKelas === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-md">Panel Administrator Sistem</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat Datang, {stats.admin.nama}
          </h1>
          <p className="text-gray-500 text-sm">
            Status sistem per{" "}
            {new Date().toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* TOP 4 CARDS - Diubah jadi grid-cols-4 di Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <StatCard
          title="Total Akun Aktif"
          value={stats.totalUsers}
          icon={<Users size={20} />}
          color="gray"
        />

        {/* Card 2 */}
        <StatCard
          title="Total Staf & Guru"
          value={stats.totalStaff}
          icon={<UserCog size={20} />}
          color="blue"
        />

        {/* Card 3: Total Santri */}
        <div
          className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 relative cursor-pointer"
          onMouseEnter={() => setShowTooltipSantri(true)}
          onMouseLeave={() => setShowTooltipSantri(false)}
          onClick={() => setShowTooltipSantri(!showTooltipSantri)}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-green-50 text-green-600">
            <Users size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                Total Santri
              </p>
              <Info size={14} className="text-gray-300 flex-shrink-0" />
            </div>
            <h2 className="text-xl font-black text-gray-800">
              {stats?.totalSantri}
            </h2>
          </div>

          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-11/12 transition-all duration-200 z-20 pointer-events-none ${showTooltipSantri ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}
          >
            <div className="bg-white rounded-xl p-3.5 shadow-xl relative">
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
              <div className="relative z-10">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                  <span className="text-blue-400">
                    Laki-laki: {stats?.santriGender?.Laki}
                  </span>
                  <span className="text-pink-400">
                    Perempuan: {stats?.santriGender?.Perempuan}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-pink-500/30 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-1000"
                    style={{
                      width:
                        stats?.totalSantri > 0
                          ? `${(stats.santriGender.Laki / stats.totalSantri) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Santri Belum Setup Data */}
        <div
          className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 relative cursor-pointer"
          onMouseEnter={() => setShowTooltipIncomplete(true)}
          onMouseLeave={() => setShowTooltipIncomplete(false)}
          onClick={() => setShowTooltipIncomplete(!showTooltipIncomplete)}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stats?.incompleteSantri?.totalIncomplete > 0 ? "bg-orange-50 text-orange-600" : "bg-gray-50 text-gray-400"}`}
          >
            <UserMinus size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                Data Belum Lengkap
              </p>
              <Info size={14} className="text-gray-300 flex-shrink-0" />
            </div>
            <h2 className="text-xl font-black text-gray-800">
              {stats?.incompleteSantri?.totalIncomplete}
            </h2>
          </div>

          {/* Tooltip List (Hover) */}
          <div
            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[80%] transition-all duration-200 z-20 pointer-events-none ${showTooltipIncomplete ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"}`}
          >
            <div className="bg-white rounded-xl p-3.5 shadow-xl relative">
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
              <div className="relative z-10">
                {stats?.incompleteSantri?.totalIncomplete > 0 ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 border-b border-gray-100 pb-1">Santri:</p>
                    <ul className="space-y-1.5 font-bold uppercase tracking-wider text-gray-800">
                      <li className="text-[10px] flex justify-between items-center">
                        <span>Tanpa No. HP:</span>
                        <span className="text-[10px] text-orange-400 text-xs bg-orange-400/10 px-1.5 py-0.5 rounded">
                          {stats?.incompleteSantri?.noHp}
                        </span>
                      </li>
                      <li className="text-[10px] flex justify-between items-center">
                        <span>Tanpa Email:</span>
                        <span className="text-[10px] text-orange-400 text-xs bg-orange-400/10 px-1.5 py-0.5 rounded">
                          {stats?.incompleteSantri?.noEmail}
                        </span>
                      </li>
                      <li className="text-[10px] flex justify-between items-center">
                        <span>Tanpa Data Wali:</span>
                        <span className="text-[10px] text-orange-400 text-xs bg-orange-400/10 px-1.5 py-0.5 rounded">
                          {stats?.incompleteSantri?.noOrtu}
                        </span>
                      </li>
                    </ul>
                  </>
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 text-center">
                    Seluruh data santri sudah lengkap!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 pb-12">
          <h3 className="font-bold text-gray-800 mb-2">
            Demografi Hak Akses (Role)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Distribusi akun pengguna dalam sistem
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataRole}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartDataRole.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[14px] font-medium text-gray-600">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Database size={18} className="text-blue-600" /> Referensi Master
            Data
          </h3>
          <div className="space-y-4">
            <MasterDataRow
              label="Data Kamar"
              count={stats.masterData.kamar}
              icon={<BedDouble size={16} />}
            />
            <MasterDataRow
              label="Data Kelas"
              count={stats.masterData.kelas}
              icon={<BookOpen size={16} />}
            />
            <MasterDataRow
              label="Jenis Layanan"
              count={stats.masterData.layanan}
              icon={<List size={16} />}
            />
            <MasterDataRow
              label="Jenis Tagihan"
              count={stats.masterData.tagihan}
              icon={<Receipt size={16} />}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" /> Log
            Peringatan Data
          </h3>
          <div className="space-y-3">
            {isSystemHealthy ? (
              <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <ShieldCheck
                  size={32}
                  className="text-green-500 mx-auto mb-2 opacity-50"
                />
                <p className="text-sm font-medium text-gray-500">
                  Seluruh santri telah teralokasi.
                </p>
              </div>
            ) : (
              <>
                {stats.systemHealth.orphanKamar > 0 && (
                  <WarningBox
                    icon={<BedDouble size={18} />}
                    title="Santri Tanpa Kamar"
                    count={stats.systemHealth.orphanKamar}
                    color="red"
                  />
                )}
                {stats.systemHealth.orphanKelas > 0 && (
                  <WarningBox
                    icon={<BookOpen size={18} />}
                    title="Santri Tanpa Kelas"
                    count={stats.systemHealth.orphanKelas}
                    color="orange"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT LOGS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-blue-600" /> Log Aktivitas
            Terbaru
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            5 Aktivitas Terakhir
          </span>
        </div>
        {recentLogs.length > 0 ? (
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition"
              >
                <div className="mt-0.5">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider flex justify-center w-[70px] ${log.aksi === "CREATE" ? "bg-green-100 text-green-700" : log.aksi === "UPDATE" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
                  >
                    {log.aksi}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight">
                    {log.keterangan}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700 capitalize">
                      {log.role_user}
                    </span>
                    <span>•</span>
                    <span className="uppercase tracking-wider">
                      {log.entitas}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Activity size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              Belum ada catatan aktivitas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
    pink: "bg-pink-100 text-pink-600",
  };
  return (
    <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {title}
        </p>
        <h2 className="text-2xl font-black text-gray-800">{value}</h2>
      </div>
    </div>
  );
}

function MasterDataRow({ label, count, icon }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl">
      <div className="flex items-center gap-3 text-gray-700">
        <div className="text-blue-500">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-sm font-bold text-gray-800 shadow-sm">
        {count}
      </div>
    </div>
  );
}

function WarningBox({ icon, title, count, color }) {
  const themes = {
    red: "bg-red-50 border-red-100 text-red-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
  };
  return (
    <div
      className={`p-4 border rounded-xl flex items-start gap-3 ${themes[color]}`}
    >
      <div className={`p-2 rounded-lg bg-white bg-opacity-50`}>{icon}</div>
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs mt-1">
          Terdapat <span className="font-black text-base">{count}</span> santri
          aktif tanpa alokasi data.
        </p>
      </div>
    </div>
  );
}
