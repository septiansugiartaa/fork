import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  MessageCircleHeart,
  Microscope,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import api from "../../config/api";
import { exportScreeningPdf } from "../../components/PdfScreening";
import { exportObservasiPdf } from "../../components/PdfObservasi";
import { getObservasiBadgeClass, getObservasiScoreLabel } from "../../components/UtilsObservasi";

const LEGACY_RECENT_STORAGE_KEY = "santri_recent_materi";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatViewedDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const tanggal = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const jam = `${String(date.getHours()).padStart(2, "0")}.${String(date.getMinutes()).padStart(2, "0")}`;

  return `${tanggal} ${jam}`;
};

const getDiagnosaStyle = (diagnosa) => {
  if (!diagnosa) return "text-gray-500";

  if (diagnosa === "Scabies") return "text-red-600 font-semibold";
  if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";

  if (
    diagnosa === "Kemungkinan_Scabies" ||
    diagnosa === "Perlu_Evaluasi_Lebih_Lanjut"
  ) {
    return "text-yellow-600 font-semibold";
  }

  return "text-gray-600";
};

export default function SantriScabiesDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [materiList, setMateriList] = useState([]);
  const [recentMateri, setRecentMateri] = useState([]);
  const [faqList, setFaqList] = useState([]);
  const [openFaqId, setOpenFaqId] = useState([]);
  const [latestReports, setLatestReports] = useState({ screening: null, observasi: null });
  const [isDownloading, setIsDownloading] = useState({ screening: false, observasi: false });
  const [loading, setLoading] = useState(true);
  const [openingConsultation, setOpeningConsultation] = useState(false);

  useEffect(() => {
    localStorage.removeItem(LEGACY_RECENT_STORAGE_KEY);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, materiRes, faqRes, latestReportsRes, recentMateriRes] = await Promise.all([
          api.get("/santri"),
          api.get("/global/viewMateri"),
          api.get("/global/faq"),
          api.get("/santri/scabies/latest-reports"),
          api.get("/santri/scabies/materi/recent"),
        ]);

        setDashboardData(dashboardRes.data?.data || null);
        setMateriList(materiRes.data?.data?.list_materi || []);

        const faqRows = faqRes.data?.data || [];
        setFaqList(faqRows);
        setLatestReports(latestReportsRes.data?.data || { screening: null, observasi: null });
        setRecentMateri((recentMateriRes.data?.data || []).slice(0, 3));
      } catch (error) {
        console.error("Gagal memuat dashboard scabies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const materiPreview = useMemo(() => materiList.slice(0, 4), [materiList]);
  const santri = dashboardData?.santri;
  const statistik = dashboardData?.statistik || {};
  const screeningTerakhir = latestReports?.screening;
  const observasiTerakhir = latestReports?.observasi;

  const handleDownloadScreening = async () => {
    if (!screeningTerakhir || isDownloading.screening) return;
    try {
      setIsDownloading((prev) => ({ ...prev, screening: true }));
      await exportScreeningPdf(screeningTerakhir, screeningTerakhir.id_screening, "download");
    } finally {
      setIsDownloading((prev) => ({ ...prev, screening: false }));
    }
  };

  const handleDownloadObservasi = async () => {
    if (!observasiTerakhir || isDownloading.observasi) return;
    try {
      setIsDownloading((prev) => ({ ...prev, observasi: true }));
      await exportObservasiPdf(observasiTerakhir, observasiTerakhir.id_observasi, "download");
    } finally {
      setIsDownloading((prev) => ({ ...prev, observasi: false }));
    }
  };

  const handleOpenConsultation = async () => {
    if (openingConsultation) return;

    try {
      setOpeningConsultation(true);
      const { data } = await api.get('/santri/konsultasi/room/me/current');
      const roomId = data?.data?.id;

      if (roomId) {
        navigate(`/santri/scabies/konsultasi/room/${roomId}`);
        return;
      }

      navigate('/santri/scabies/konsultasi');
    } catch (error) {
      console.error('Gagal membuka konsultasi:', error);
      navigate('/santri/scabies/konsultasi');
    } finally {
      setOpeningConsultation(false);
    }
  };

  if (loading || openingConsultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">{openingConsultation ? 'Membuka konsultasi...' : 'Memuat dashboard scabies...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white px-4 sm:px-6 py-6 pb-24 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/santri")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Dashboard Scabies</h1>
            <p className="text-green-100 text-sm truncate">Pusat edukasi, konsultasi, dan ringkasan kesehatan santri</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Menu</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">Akses Cepat</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/santri/scabies/viewMateri", { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                  className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-md transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3">
                    <BookOpen size={22} />
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">View Materi</h4>
                  <p className="text-sm text-gray-500 mt-1">Akses seluruh materi edukasi scabies dan pencegahannya.</p>
                </button>

                <button
                  onClick={handleOpenConsultation}
                  disabled={openingConsultation}
                  className="text-left bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <MessageCircleHeart size={22} />
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">Konsultasi Timkes</h4>
                  <p className="text-sm text-gray-500 mt-1">{openingConsultation ? 'Membuka konsultasi...' : 'Tombol menuju halaman konsultasi dengan tim kesehatan.'}</p>
                </button>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-green-600" size={18} />
                  <h3 className="text-lg font-bold text-gray-800">Materi Terakhir Dilihat</h3>
                </div>
                <button
                  onClick={() => navigate("/santri/scabies/viewMateri", { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 cursor-pointer"
                >
                  Jelajahi Materi <ArrowRight size={14} />
                </button>
              </div>
              {recentMateri.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada materi yang dibuka. Mulai baca materi agar riwayat tampil di sini.</p>
              ) : (
                <div className="space-y-3">
                  {recentMateri.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/santri/scabies/viewMateri/${item.id}`, { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                      className="w-full text-left border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <p className="text-xs text-gray-400">Terakhir dilihat {formatViewedDateTime(item.terakhir_dilihat)}</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-1">{item.judul}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-green-600" size={18} />
                  <h3 className="text-lg font-bold text-gray-800">Akses Materi Instan</h3>
                </div>
                <button
                  onClick={() => navigate("/santri/scabies/viewMateri", { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                  className="text-sm font-semibold text-green-600 hover:text-green-700 cursor-pointer"
                >
                  Lihat Materi Lainnya
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {materiPreview.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition">
                    {item.gambar ? (
                      <img src={`/uploads/${item.gambar}`} alt={item.judul} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                        <Microscope className="text-emerald-600" size={32} />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 line-clamp-2">{item.judul}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.ringkasan || "Pelajari materi ini untuk memahami penanganan dan pencegahan scabies."}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate(`/santri/scabies/viewMateri/${item.id}`, { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 cursor-pointer"
                        >
                          Baca Selengkapnya <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={handleOpenConsultation}
                          disabled={openingConsultation}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Tanya Timkes
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-green-600" size={18} />
                  <h3 className="text-lg font-bold text-gray-800">Screening & Observasi</h3>
                </div>
              </div>

              <article className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-gray-700">
                  <Stethoscope size={16} />
                  <p className="font-semibold text-sm">Screening Terakhir</p>
                </div>
                {screeningTerakhir ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Tanggal</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-gray-700">{formatDate(screeningTerakhir?.tanggal)}</span>
                    </div>
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Diagnosis</span>
                      <span className="text-gray-500">:</span>
                      <span className={getDiagnosaStyle(screeningTerakhir?.diagnosa)}>
                        {(screeningTerakhir?.diagnosa || "-").replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Pemeriksa</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-gray-700">{screeningTerakhir?.users_screening_id_timkesTousers?.nama || "-"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Belum ada screening</p>
                )}
                {screeningTerakhir && (
                  <button
                    onClick={handleDownloadScreening}
                    disabled={isDownloading.screening}
                    className="mt-3 w-full text-xs font-semibold px-3 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDownloading.screening ? "Menyiapkan PDF..." : "Download PDF Screening"}
                  </button>
                )}
              </article>

              <article className="rounded-xl border border-gray-100 p-4 bg-gray-50 mt-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <ClipboardList size={16} />
                  <p className="font-semibold text-sm">Observasi Terakhir</p>
                </div>
                {observasiTerakhir ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Tanggal</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-gray-700">{formatDate(observasiTerakhir?.tanggal)}</span>
                    </div>
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Waktu</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-gray-700">{observasiTerakhir?.waktu || "-"}</span>
                    </div>
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Skor</span>
                      <span className="text-gray-500">:</span>
                      <span className={`inline-flex max-w-max rounded-full px-2 py-0.5 text-xs font-semibold ${getObservasiBadgeClass(observasiTerakhir?.kategori_skor || "Kurang")}`}>
                        {observasiTerakhir?.skor_label || getObservasiScoreLabel(observasiTerakhir?.total_skor || 0)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[84px_10px_1fr] text-xs">
                      <span className="text-gray-500">Pengamat</span>
                      <span className="text-gray-500">:</span>
                      <span className="text-gray-700">{observasiTerakhir?.users_observasi_id_timkesTousers?.nama || "-"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Belum ada Observasi</p>
                )}
                {observasiTerakhir && (
                  <button
                    onClick={handleDownloadObservasi}
                    disabled={isDownloading.observasi}
                    className="mt-3 w-full text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDownloading.observasi ? "Menyiapkan PDF..." : "Download PDF Observasi"}
                  </button>
                )}
              </article>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
                  <p className="text-[11px] text-green-700">Screening</p>
                  <p className="text-lg font-bold text-green-900">{statistik.jumlah_screening || 0}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-blue-700">Observasi</p>
                  <p className="text-lg font-bold text-blue-900">{statistik.jumlah_observasi || 0}</p>
                </div>
              </div>

              <button
                onClick={() => navigate("/santri/scabies/viewMateri", { state: { from: "/santri/scabies", rootFrom: "/santri/scabies" } })}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition cursor-pointer"
              >
                <ShieldCheck size={16} />
                Pelajari Pencegahan
              </button>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <CircleHelp className="text-green-600" size={18} />
                  <h3 className="text-lg font-bold text-gray-800">FAQ</h3>
                </div>
                {faqList.length > 0 && (
                  <button
                    onClick={() => setOpenFaqId([])}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 cursor-pointer"
                  >
                    <RefreshCcw size={12} />
                    Reset
                  </button>
                )}
              </div>

              {faqList.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada FAQ.</p>
              ) : (
                <div className="space-y-3">
                  {faqList.map((item) => {
                    const isOpen = openFaqId.includes(item.id_faq);
                    return (
                      <div key={item.id_faq} className="border border-gray-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => {
                            setOpenFaqId(prev =>
                              prev.includes(item.id_faq)
                                ? prev.filter(id => id !== item.id_faq)
                                : [...prev, item.id_faq]
                            );
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                        >
                          <span className="text-left text-sm font-semibold text-gray-800">{item.pertanyaan}</span>
                          <ChevronDown size={18} className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="px-4 py-4 text-sm text-gray-700 leading-relaxed bg-white border-t border-gray-100 whitespace-pre-wrap">
                            {item.jawaban}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
