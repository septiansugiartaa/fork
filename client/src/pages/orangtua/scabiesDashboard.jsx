import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  Cross,
  Home,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import NotificationDropdown from "../../components/NotificationDropdown";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function OrangTuaScabiesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [activeSantriId, setActiveSantriId] = useState(localStorage.getItem("active_santri_id") || "");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orangtua/dashboard", {
        params: { id_santri: activeSantriId },
      });

      if (res.data.success) {
        setData(res.data.data);
        if (!activeSantriId && res.data.data.anak.id) {
          localStorage.setItem("active_santri_id", res.data.data.anak.id);
          setActiveSantriId(res.data.data.anak.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSantriId]);

  const handleSwitchAnak = (newId) => {
    localStorage.setItem("active_santri_id", newId);
    setActiveSantriId(newId);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!data) return null;

  const scabiesDashboard = data.scabies_dashboard || {};
  const scabiesSummary = scabiesDashboard.summary || {};
  const monthlyScabies = scabiesDashboard.chart_bulanan || [];
  const yearlyScabies = scabiesDashboard.chart_tahunan || [];
  const latestHistory = scabiesDashboard.latest_history || [];
  const scabiesInsights = scabiesDashboard.insights || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">SIM-Tren</h1>
            <p className="text-green-100">Monitoring Scabies Anak oleh Wali</p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 text-left p-2 rounded-xl hover:bg-white/10 transition focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 transition">
                  <img
                    src={`/foto-profil/${data.ortu.foto_profil}`}
                    alt={data.ortu.nama}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${data.ortu.nama}`;
                    }}
                  />
                </div>
                <div>
                  <p className="font-medium leading-tight">{data.ortu.nama}</p>
                  <p className="text-sm text-white/75">
                    {data.ortu.hubungan} {data.anak.nama.split(" ")[0]}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-green-200 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border py-2 z-50">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/orangtua/profil");
                    }}
                    className="w-full flex items-center py-3 px-5 text-gray-500 hover:bg-green-50 hover:text-green-700 transition"
                  >
                    <Settings size={16} className="mr-2" /> <span className="text-sm font-semibold">Edit Profil</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center py-3 px-5 text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} className="mr-2" /> <span className="text-sm font-semibold">Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6 border border-white">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
            <img
              src={`/foto-profil/${data.anak.foto_profil}`}
              className="w-full h-full object-cover"
              alt="Foto Anak"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${data.anak.nama}`;
              }}
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1 justify-center md:justify-start">
              <p className="text-teal-600 text-xs font-bold uppercase tracking-widest">Dashboard Scabies Anak</p>
              {data.list_anak && data.list_anak.length > 1 && (
                <select
                  value={activeSantriId}
                  onChange={(e) => handleSwitchAnak(e.target.value)}
                  className="text-xs bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded-lg border-none outline-none cursor-pointer focus:ring-2 focus:ring-green-500 mx-auto md:mx-0"
                >
                  {data.list_anak.map((anak) => (
                    <option key={anak.id_santri} value={anak.id_santri}>
                      Ganti ke: {anak.nama}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <h2 className="text-2xl font-black text-gray-800">{data.anak.nama}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">NIS: {data.anak.nip}</span>
              <span className="bg-green-50 px-3 py-1 rounded-full text-xs font-bold text-green-600">{data.anak.kelas}</span>
              <span className="bg-purple-50 px-3 py-1 rounded-full text-xs font-bold text-purple-600">{data.anak.kamar}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/orangtua")}
            className="w-full md:w-auto bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-2xl font-bold shadow-sm active:scale-95 transition hover:bg-gray-50"
          >
            Kembali ke Beranda
          </button>
        </div>

        <section className="mt-8 mb-12 space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold uppercase tracking-wide text-teal-600">Analytical Dashboard</p>
            <h3 className="text-2xl font-black text-gray-900">Analitik Monitoring Kesehatan {data.anak.nama.split(" ")[0]}</h3>
            <p className="text-sm text-gray-500 max-w-3xl">
              Ringkasan ini membaca riwayat screening dan observasi anak secara personal, sehingga wali bisa cepat melihat kondisi terakhir, pola pemantauan, dan area yang perlu diperhatikan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <ScabiesParentCard
              title="Screening Terakhir"
              value={scabiesSummary.screening_terakhir?.diagnosa_label || "Belum Screening"}
              detail={scabiesSummary.screening_terakhir?.tanggal ? `Diperiksa ${formatDate(scabiesSummary.screening_terakhir.tanggal)}` : "Belum ada riwayat screening"}
              icon={<ShieldAlert size={20} />}
              tone={getDiagnosisTone(scabiesSummary.screening_terakhir?.diagnosa)}
            />
            <ScabiesParentCard
              title="Observasi Terakhir"
              value={scabiesSummary.observasi_terakhir ? `${formatNumber(scabiesSummary.observasi_terakhir.skor)} - ${scabiesSummary.observasi_terakhir.kategori}` : "Belum Ada"}
              detail={scabiesSummary.observasi_terakhir?.tanggal ? `Dinilai ${formatDate(scabiesSummary.observasi_terakhir.tanggal)}` : "Belum ada observasi cuci tangan"}
              icon={<Activity size={20} />}
              tone={getObservasiTone(scabiesSummary.observasi_terakhir?.kategori)}
            />
            <ScabiesParentCard
              title="Total Riwayat Screening"
              value={formatNumber(scabiesSummary.total_screening)}
              detail="Jumlah pemeriksaan scabies yang tercatat"
              icon={<LineChartIcon size={20} />}
              tone="blue"
            />
            <ScabiesParentCard
              title="Riwayat Aman"
              value={formatNumber(scabiesSummary.total_bukan_scabies)}
              detail="Jumlah screening dengan hasil bukan scabies"
              icon={<ShieldCheck size={20} />}
              tone="green"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ScabiesParentChartCard
              title="Tren Bulanan Screening Anak"
              description="Membaca perubahan hasil screening anak pada tahun berjalan."
              data={monthlyScabies}
              xKey="month"
            />
            <ScabiesParentChartCard
              title="Tren Tahunan Screening Anak"
              description="Ringkasan riwayat screening anak dalam lima tahun terakhir."
              data={yearlyScabies}
              xKey="year"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-900">Riwayat Screening Terakhir</h4>
                  <p className="text-xs text-gray-500 mt-1">Tiga pemeriksaan terakhir untuk membantu wali membaca perubahan kondisi anak dari waktu ke waktu.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/orangtua/daftarSantriScreening/${data.anak.id}`)}
                  className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition"
                >
                  Lihat Selengkapnya
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left">No</th>
                      <th className="px-5 py-3 text-left">Tanggal</th>
                      <th className="px-5 py-3 text-left">Hasil Diagnosa</th>
                      <th className="px-5 py-3 text-left">Makna</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {latestHistory.length > 0 ? (
                      latestHistory.map((item, index) => (
                        <tr key={item.id_screening} className="hover:bg-gray-50">
                          <td className="px-5 py-4">{index + 1}</td>
                          <td className="px-5 py-4 font-medium text-gray-800">{formatDate(item.tanggal)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getDiagnosisBadge(item.diagnosa)}`}>
                              {item.diagnosa_label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600">{getDiagnosisMeaning(item.diagnosa)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-5 py-10 text-center text-gray-400">
                          Belum ada riwayat screening untuk anak ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Riwayat Observasi Terakhir</h4>
                    <p className="text-xs text-gray-500 mt-1">Ringkasan observasi cuci tangan terakhir sebagai bahan pemantauan perilaku kebersihan anak.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/orangtua/daftarSantriObservasi/${data.anak.id}`)}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition"
                  >
                    Lihat Selengkapnya
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Tanggal Observasi</p>
                      <p className="mt-2 text-sm font-semibold text-gray-800">
                        {scabiesSummary.observasi_terakhir?.tanggal ? formatDate(scabiesSummary.observasi_terakhir.tanggal) : "Belum ada observasi"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Skor dan Kategori</p>
                      <p className="mt-2 text-sm font-semibold text-gray-800">
                        {scabiesSummary.observasi_terakhir ? `${formatNumber(scabiesSummary.observasi_terakhir.skor)} - ${scabiesSummary.observasi_terakhir.kategori}` : "Belum ada observasi"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h4 className="font-bold text-gray-900 mb-4">Insight Wali</h4>
                <div className="space-y-4">
                  <InsightItem label="Status Terakhir" value={scabiesInsights.status_terakhir || "Belum ada insight status terakhir."} />
                  <InsightItem label="Intensitas Monitoring" value={scabiesInsights.intensitas_monitoring || "Belum ada insight monitoring."} />
                  <InsightItem label="Observasi Terakhir" value={scabiesInsights.observasi_terakhir || "Belum ada insight observasi."} />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h4 className="font-bold text-gray-900 mb-4">Komposisi Riwayat Screening</h4>
                <div className="space-y-4">
                  <StatProgress
                    label="Riwayat Scabies"
                    value={scabiesSummary.total_scabies}
                    total={scabiesSummary.total_screening}
                    barClassName="bg-red-500"
                    valueClassName="text-red-600"
                  />
                  <StatProgress
                    label="Riwayat Evaluasi Lanjutan"
                    value={scabiesSummary.total_evaluasi}
                    total={scabiesSummary.total_screening}
                    barClassName="bg-amber-400"
                    valueClassName="text-amber-600"
                  />
                  <StatProgress
                    label="Riwayat Bukan Scabies"
                    value={scabiesSummary.total_bukan_scabies}
                    total={scabiesSummary.total_screening}
                    barClassName="bg-green-500"
                    valueClassName="text-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-100 md:hidden">
        <div className="flex justify-around">
          <button onClick={() => navigate("/orangtua")} className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600">
            <Home size={24} />
            <span className="text-xs mt-1">Beranda</span>
          </button>
          <button onClick={() => navigate("/orangtua/kesehatan")} className="flex flex-col items-center p-2 text-green-600">
            <Cross size={24} />
            <span className="text-xs mt-1">Scabies</span>
          </button>
          <button onClick={() => navigate("/orangtua/profil")} className="flex flex-col items-center p-2 text-gray-600 hover:text-green-600">
            <User size={24} />
            <span className="text-xs mt-1">Profil</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center p-2 text-gray-600 hover:text-red-600">
            <LogOut size={24} />
            <span className="text-xs mt-1">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ScabiesParentCard({ title, value, detail, icon, tone }) {
  const tones = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tones[tone] || tones.gray}`}>{icon}</div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <h4 className="mt-1 text-xl font-black text-gray-900">{value}</h4>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function ScabiesParentChartCard({ title, description, data, xKey }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <RechartsTooltip content={<ParentScabiesTooltip />} />
            <Line type="monotone" dataKey="scabies" name="Scabies" stroke="#dc2626" strokeWidth={3} dot={{ r: 3, fill: "#dc2626", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="evaluasi" name="Evaluasi Lanjutan" stroke="#d97706" strokeWidth={3} dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="bukan_scabies" name="Bukan Scabies" stroke="#16a34a" strokeWidth={3} dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
        <LegendItem label="Scabies" color="#dc2626" />
        <LegendItem label="Evaluasi Lanjutan" color="#d97706" />
        <LegendItem label="Bukan Scabies" color="#16a34a" />
      </div>
    </div>
  );
}

function ParentScabiesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-lg">
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

function LegendItem({ label, color }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600">
      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

function InsightItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm text-gray-700 mt-2 leading-6">{value}</p>
    </div>
  );
}

function StatProgress({ label, value, total, barClassName, valueClassName }) {
  const percent = total ? (Number(value || 0) / Number(total || 0)) * 100 : 0;

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

function getDiagnosisTone(diagnosa) {
  if (diagnosa === "Scabies") return "red";
  if (diagnosa === "Bukan_Scabies") return "green";
  if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut") return "amber";
  return "gray";
}

function getObservasiTone(kategori) {
  if (kategori === "Baik") return "green";
  if (kategori === "Cukup") return "amber";
  if (kategori === "Kurang") return "red";
  return "gray";
}

function getDiagnosisBadge(diagnosa) {
  if (diagnosa === "Scabies") return "bg-red-100 text-red-700";
  if (diagnosa === "Bukan_Scabies") return "bg-green-100 text-green-700";
  if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

function getDiagnosisMeaning(diagnosa) {
  if (diagnosa === "Scabies") return "Perlu perhatian lebih dan tindak lanjut kesehatan.";
  if (diagnosa === "Bukan_Scabies") return "Hasil screening menunjukkan kondisi relatif aman.";
  if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut") {
    return "Perlu pemantauan dan evaluasi lanjutan dari tim kesehatan.";
  }
  return "Belum ada interpretasi khusus.";
}
