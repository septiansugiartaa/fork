import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Users, BookOpen, Calendar, AlertCircle, Clock, Bell, CheckCircle, AlertTriangle, Home, Settings, LogOut, Loader2, ChevronDown, MessageSquare, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navigate = useNavigate();
  // Sesuaikan URL dengan env atau konvensi routingmu
  const API_URL = "http://localhost:3000/api/ustadz";

  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/dashboard");
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data dashboard");
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      if (err.response) setError(err.response.data?.message || `Error ${err.response.status}`);
      else if (err.request) setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      else setError("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu.nama);
    if (menu.endpoint) navigate(menu.endpoint);
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("selesai") || statusLower.includes("ditangani")) return "bg-green-100 text-green-800";
    if (statusLower.includes("belum") || statusLower.includes("diproses") || statusLower.includes("baru")) return "bg-yellow-100 text-yellow-800";
    if (statusLower.includes("penting") || statusLower.includes("batal")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5).replace(":", ".");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data dashboard Ustadz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchDashboardData} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition mb-3">Coba Lagi</button>
          <button onClick={handleLogout} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition">Kembali ke Login</button>
        </div>
      </div>
    );
  }

  const { ustadz, kegiatan_hari_ini = [], pengaduan_terbaru = [], statistik = {}, menu_cepat = [] } = dashboardData;

  const defaultMenu = [
    { id: 1, nama: "Daftar Santri", ikon: Users, warna: "bg-green-500", endpoint: "/ustadz/daftar-santri" },
    { id: 2, nama: "Jadwal & Kegiatan", ikon: Calendar, warna: "bg-blue-500", endpoint: "/ustadz/kegiatan" },
    { id: 3, nama: "Pengaduan", ikon: MessageSquare, warna: "bg-orange-500", endpoint: "/ustadz/pengaduan" }
  ];

  const menuToDisplay = menu_cepat.length > 0 ? menu_cepat.map((menu, index) => ({
    ...menu,
    ikon: [Calendar, Users, MessageSquare, ClipboardList][index] || BookOpen,
    warna: ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"][index] || "bg-gray-500"
  })) : defaultMenu;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">SIM-Tren</h1>
              <p className="text-green-100">Sistem Informasi Manajemen Pesantren</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition relative">
                <Bell size={24} />
                {pengaduan_terbaru.length > 0 && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-green-600"></span>
                )}
              </button>
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 text-left p-2 rounded-xl hover:bg-white/10 transition focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                      {ustadz.foto_profil !== '-' ? (
                         <img src={`http://localhost:3000/foto-profil/${ustadz.foto_profil}`} alt={ustadz.nama} className="w-full h-full object-cover"/>
                      ) : (
                         <User size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{ustadz.nama}</p>
                      <p className="text-sm text-white/75">NIP: {ustadz.nip}</p>
                    </div>
                    <ChevronDown size={16} className={`text-green-200 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-md py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <button onClick={() => { setIsProfileOpen(false); navigate("/ustadz/profil"); }} className="w-full text-left px-4 py-2.5 text-md text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center transition">
                        <Settings size={16} className="mr-3" /> Profil & Pengaturan
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-md text-red-600 hover:bg-red-50 flex items-center transition">
                        <LogOut size={16} className="mr-3" /> Keluar
                      </button>
                    </div>
                  )}
                  {isProfileOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-2xl">
            <p className="text-green-100 mb-1">Ahlan wa Sahlan,</p>
            <h2 className="text-3xl font-bold mb-4">Ustadz {ustadz.nama}</h2>
            <div className="flex flex-wrap gap-3">
              {ustadz.jabatan.map((jabatanItem, index) => (
                <div key={index} className="bg-white/10 border border-white/20 px-4 py-2 rounded-xl flex items-center shadow-xs">
                  <BookOpen size={18} className="text-green-300 mr-2 shrink-0"/>
                  <span className="text-sm font-medium whitespace-nowrap">{jabatanItem}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Access */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Akses Cepat</h3>
              <div className="grid grid-cols-3 gap-4">
                {menuToDisplay.map((menu) => {
                  const Icon = menu.ikon;
                  return (
                    <button key={menu.id} onClick={() => handleMenuClick(menu)} className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition group">
                      <div className={`${menu.warna} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <span className="font-semibold text-sm text-gray-700 text-center">{menu.nama}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jadwal Kegiatan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="mr-2 text-blue-500" size={20} />
                  Kegiatan & Jadwal Hari Ini
                </h3>
                <span className="text-sm text-gray-500 font-medium">{formatDate(new Date())}</span>
              </div>
              
              {kegiatan_hari_ini.length > 0 ? (
                <div className="space-y-3">
                  {kegiatan_hari_ini.map((kegiatan, index) => (
                    <div key={index} className="flex p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition">
                      <div className="w-24 text-blue-700 font-bold border-r border-blue-200 flex flex-col justify-center">
                        <span>{formatTime(kegiatan.waktu_mulai)}</span>
                        <span className="text-xs text-blue-400">s/d {formatTime(kegiatan.waktu_selesai)}</span>
                      </div>
                      <div className="flex-1 pl-4 flex flex-col justify-center">
                        <p className="font-bold text-gray-800">{kegiatan.nama}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{kegiatan.deskripsi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Tidak ada jadwal kegiatan hari ini</p>
                </div>
              )}
            </div>

            {/* Pengaduan Masuk */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <AlertCircle className="mr-2 text-orange-500" size={20} />
                  Pengaduan Santri Terbaru
                </h3>
              </div>
              
              {pengaduan_terbaru.length > 0 ? (
                <div className="space-y-3">
                  {pengaduan_terbaru.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-100 rounded-xl hover:bg-orange-50/30 transition">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-800 text-sm">{item.nama_santri}</h4>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.deskripsi}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1"/> {formatDate(item.waktu)}
                        </span>
                        <button onClick={() => navigate(`/ustadz/pengaduan/${item.id}`)} className="text-xs font-bold text-orange-600 hover:text-orange-700">
                          Lihat Selengkapnya &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <CheckCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Alhamdulillah, tidak ada pengaduan baru</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Ikhtisar Pondok</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-green-800 text-sm font-medium mb-1">Total Santri Aktif</p>
                    <p className="text-3xl font-black text-green-700">{statistik.jumlah_santri || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200/50 rounded-full flex items-center justify-center">
                    <Users className="text-green-600" size={24} />
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-orange-800 text-sm font-medium mb-1">Pengaduan Belum Selesai</p>
                    <p className="text-3xl font-black text-orange-700">{statistik.pengaduan_aktif || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200/50 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-orange-600" size={24} />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-blue-800 text-sm font-medium mb-1">Kegiatan Aktif</p>
                    <p className="text-3xl font-black text-blue-700">{statistik.kegiatan_aktif || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200/50 rounded-full flex items-center justify-center">
                    <Calendar className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-3 z-50 border border-gray-100 md:hidden">
        <div className="flex justify-around items-center">
          <button onClick={() => setActiveMenu('home')} className={`flex flex-col items-center p-2 transition ${activeMenu === 'home' ? 'text-green-600 scale-110' : 'text-gray-400 hover:text-green-500'}`}>
            <Home size={22} className={activeMenu === 'home' ? "fill-current" : ""} />
            <span className="text-[10px] mt-1 font-medium">Beranda</span>
          </button>
          <button onClick={() => navigate("/ustadz/daftar-santri")} className="flex flex-col items-center p-2 text-gray-400 hover:text-green-500 transition">
            <Users size={22} />
            <span className="text-[10px] mt-1 font-medium">Santri</span>
          </button>
          <button onClick={() => navigate("/ustadz/pengaduan")} className="flex flex-col items-center p-2 text-gray-400 hover:text-green-500 transition">
            <MessageSquare size={22} />
            <span className="text-[10px] mt-1 font-medium">Pengaduan</span>
          </button>
          <button onClick={() => navigate("/ustadz/profil")} className="flex flex-col items-center p-2 text-gray-400 hover:text-green-500 transition">
            <User size={22} />
            <span className="text-[10px] mt-1 font-medium">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}