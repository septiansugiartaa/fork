import { useState, useEffect, useContext } from "react";
import api from "../config/api";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Plus, ClipboardList } from "lucide-react";
import CardMateri from "../components/CardMateri";
import AjukanMateriModal from "../components/AjukanMateriModal";
import RiwayatPengajuanModal from "../components/RiwayatPengajuanModal";
import AlertToast from "../components/AlertToast";
import { AuthContext } from "../context/AuthContext";

const LEGACY_RECENT_STORAGE_KEY = "santri_recent_materi";

// Role yang TIDAK boleh melihat tombol ajukan/riwayat
const EXCLUDED_ROLES = ["admin", "timkesehatan"];

export default function MateriView() {
  const [materi, setMateri]                         = useState([]);
  const [search, setSearch]                         = useState("");
  const [loading, setLoading]                       = useState(true);
  const [isAjukanOpen, setIsAjukanOpen]             = useState(false);
  const [isRiwayatOpen, setIsRiwayatOpen]           = useState(false);
  const [alert, setAlert]                           = useState({ show: false, message: "", type: "success" });

  const { user } = useContext(AuthContext);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isPublicMateriPage = location.pathname.startsWith("/materi");
  const rootFrom     = location.state?.rootFrom || location.state?.from || (isPublicMateriPage ? "/" : "/santri");
  const backPath     = rootFrom;
  const detailBasePath = isPublicMateriPage ? "/materi" : "/santri/scabies/viewMateri";

  // Apakah user yang login termasuk role yang dikecualikan?
  const role              = user?.role?.trim().toLowerCase();
  const isExcludedRole    = role && EXCLUDED_ROLES.includes(role);
  // Tampilkan tombol ajukan: public user (tidak login) ATAU login tapi bukan excluded role
  const showAjukanButton  = !isExcludedRole;
  // Tampilkan tombol riwayat: hanya user yang login dan bukan excluded role
  const showRiwayatButton = user && !isExcludedRole;

  const fetchMateri = async () => {
    try {
      setLoading(true);
      const endpoint = isPublicMateriPage ? "/public/materi" : "/global/viewMateri";
      const res = await api.get(endpoint);
      if (res.data.success) {
        setMateri(res.data.data.list_materi);
      } else {
        console.error(res.data.message);
        setMateri([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.removeItem(LEGACY_RECENT_STORAGE_KEY);
    fetchMateri();
  }, [isPublicMateriPage]);

  const showSuccess = (message) => {
    setAlert({ show: true, message, type: "success" });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Pisahkan materi berdasarkan sumber
  const filtered = materi.filter((item) =>
    item.judul.toLowerCase().includes(search.toLowerCase())
  );
  const materiTeori      = filtered.filter((item) => item.sumber !== "pengalaman");
  const materiPengalaman = filtered.filter((item) => item.sumber === "pengalaman");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Toast */}
      {alert.show && (
        <AlertToast
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "success" })}
        />
      )}

      {/* HEADER */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold truncate">Daftar Materi</h1>
            <p className="text-green-100 text-sm truncate">
              Jendela Ilmu Pengetahuan Tentang Scabies
            </p>
          </div>

          {/* Tombol Ajukan & Riwayat */}
          {showAjukanButton && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {showRiwayatButton && (
                <button
                  onClick={() => setIsRiwayatOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl font-medium text-sm transition backdrop-blur-sm border border-white/30"
                >
                  <ClipboardList size={16} />
                  <span className="hidden sm:inline">Riwayat Pengajuan</span>
                </button>
              )}
              <button
                onClick={() => setIsAjukanOpen(true)}
                className="flex items-center gap-2 bg-white text-green-700 hover:bg-green-50 px-3 py-2 rounded-xl font-semibold text-sm transition shadow-md"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Ajukan Materi Pengalaman</span>
                <span className="sm:hidden">Ajukan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-6xl mx-auto -mt-16 mb-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari berdasarkan judul materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* MATERI BERDASARKAN TEORI */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-500 rounded-full inline-block" />
            Materi Berdasarkan Teori
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-3">
            Materi yang diterbitkan oleh Tim Kesehatan
          </p>
        </div>

        {materiTeori.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {materiTeori.map((item) => (
              <CardMateri
                key={item.id}
                materi={item}
                detailBasePath={detailBasePath}
                fromPath={location.pathname}
                rootFrom={rootFrom}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-100">
            Belum ada materi teori yang tersedia.
          </p>
        )}

        {/* MATERI BERDASARKAN PENGALAMAN */}
        {materiPengalaman.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full inline-block" />
                Materi Berdasarkan Pengalaman
              </h2>
              <p className="text-sm text-gray-500 mt-1 ml-3">
                Pengajuan materi yang telah disetujui oleh Tim Kesehatan
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {materiPengalaman.map((item) => (
                <CardMateri
                  key={item.id}
                  materi={item}
                  detailBasePath={detailBasePath}
                  fromPath={location.pathname}
                  rootFrom={rootFrom}
                />
              ))}
            </div>
          </div>
        )}

        {/* Kalau semua filter kosong */}
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-10">Materi tidak ditemukan.</p>
        )}
      </div>

      {/* MODAL */}
      <AjukanMateriModal
        isOpen={isAjukanOpen}
        onClose={() => setIsAjukanOpen(false)}
        onSuccess={() =>
          showSuccess("Pengajuan berhasil dikirim! Tim Kesehatan akan meninjau materi Anda.")
        }
      />
      <RiwayatPengajuanModal
        isOpen={isRiwayatOpen}
        onClose={() => setIsRiwayatOpen(false)}
      />
    </div>
  );
}
