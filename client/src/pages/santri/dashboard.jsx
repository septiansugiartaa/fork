import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, FileText, CreditCard, Calendar, AlertCircle, History, Clock, Bell, ChevronRight, CheckCircle, XCircle, AlertTriangle, Home, Settings, LogOut, Loader2, ChevronDown } from "lucide-react";

export default function SantriDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/santri";

  // Create axios instance with token
  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle response errors
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

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await api.get("/");
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || "Gagal mengambil data dashboard");
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      if (err.response) {
        setError(err.response.data?.message || `Error ${err.response.status}`);
      } else if (err.request) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      } else {
        setError("Terjadi kesalahan: " + err.message);
      }
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
    if (menu.endpoint) {
      navigate(menu.endpoint);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("aktif") || statusLower.includes("lunas") || 
        statusLower.includes("selesai") || statusLower.includes("hadir")) {
      return "bg-green-100 text-green-800";
    } else if (statusLower.includes("belum") || statusLower.includes("diproses")) {
      return "bg-yellow-100 text-yellow-800";
    } else if (statusLower.includes("tidak") || statusLower.includes("batal")) {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    if (!status) return <Clock size={16} />;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("aktif") || statusLower.includes("lunas") || 
        statusLower.includes("selesai") || statusLower.includes("hadir")) {
      return <CheckCircle size={16} />;
    } else if (statusLower.includes("belum") || statusLower.includes("diproses")) {
      return <AlertTriangle size={16} />;
    }
    return <Clock size={16} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Format waktu dari "HH:MM:SS" ke "HH.MM"
    return timeString.substring(0, 5).replace(":", ".");
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={fetchDashboardData} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
              Coba Lagi
            </button>
            <button onClick={handleLogout} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition">
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Jika tidak ada data
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">Tidak ada data yang ditemukan</p>
        </div>
      </div>
    );
  }

  // Destructure data dari backend
  const { 
    santri, 
    keuangan, 
    kegiatan_hari_ini = [], 
    aktivitas_terakhir = {},
    statistik = {},
    menu_cepat = []
  } = dashboardData;

  // Format aktivitas terakhir menjadi array
  // 1. Ambil list pengaduan (Pastikan array)
  const pengaduanList = Array.isArray(aktivitas_terakhir.pengaduan) 
    ? aktivitas_terakhir.pengaduan 
    : [];

  // 2. Definisikan aktivitasArray (Gabungan Observasi + Screening)
  const aktivitasArray = [
    ...(aktivitas_terakhir.observasi ? [{
      ...aktivitas_terakhir.observasi,
      jenis: "observasi",
      tanggal: formatDate(aktivitas_terakhir.observasi.tanggal)
    }] : []),
    ...(aktivitas_terakhir.screening ? [{
      ...aktivitas_terakhir.screening,
      jenis: "screening",
      tanggal: formatDate(aktivitas_terakhir.screening.tanggal)
    }] : [])
  ].sort((a, b) => new Date(b.waktu || b.tanggal) - new Date(a.waktu || a.tanggal));

  // Default menu jika tidak ada dari backend
  const defaultMenu = [
    { id: 1, nama: "Pendataan Diri", ikon: User, warna: "bg-blue-500" },
    { id: 2, nama: "Tagihan & Keuangan", ikon: CreditCard, warna: "bg-green-500" },
    { id: 3, nama: "Kegiatan", ikon: Calendar, warna: "bg-purple-500" },
    { id: 4, nama: "Pengaduan", ikon: AlertCircle, warna: "bg-orange-500" },
    { id: 5, nama: "Laporan", ikon: FileText, warna: "bg-red-500" },
    { id: 6, nama: "Riwayat", ikon: History, warna: "bg-indigo-500" }
  ];

  const menuToDisplay = menu_cepat.length > 0 ? menu_cepat.map((menu, index) => ({
    ...menu,
    ikon: [User, CreditCard, Calendar, AlertCircle, FileText, History][index] || User,
    warna: ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-indigo-500"][index] || "bg-gray-500"
  })) : defaultMenu;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">SIM-Tren</h1>
              <p className="text-blue-100">Sistem Informasi Manajemen Pesantren</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
                <Bell size={24} />
              </button>
              <div className="hidden md:flex items-center space-x-2">
                <div className="relative hidden md:block">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 text-left p-2 rounded-xl hover:bg-white/10 transition focus:outline-none"
                  >
                    <div className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{santri.nama}</p>
                      <p className="text-sm text-white/75">NIS: {santri.nip}</p>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-blue-200 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu Absolute */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-md py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                      {/* Item 1: Edit Profil */}
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate("/santri/profil");
                        }}
                        className="w-full text-left px-4 py-2.5 text-md text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition"
                      >
                        <Settings size={16} className="mr-3" />
                        Edit Profil
                      </button>

                      {/* Item 2: Keluar */}
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-md text-red-600 hover:bg-red-50 flex items-center transition"
                      >
                        <LogOut size={16} className="mr-3" />
                        Keluar
                      </button>

                    </div>
                  )}

                  {/* Backdrop transparan untuk menutup dropdown saat klik di luar */}
                  {isProfileOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-2xl">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mr-4">
                <User size={32} />
              </div>
              <div>
                <p className="text-blue-100 mb-1">Selamat datang kembali</p>
                <h2 className="text-2xl font-bold">{santri.nama}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-blue-100 mb-1">Kelas</p>
                <p className="text-xl font-semibold">{santri.kelas}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="text-blue-100 mb-1">Kamar</p>
                <p className="text-xl font-semibold">{santri.kamar}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Quick Access & Today Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Access Menu */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Menu Cepat</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {menuToDisplay.map((menu) => {
                  const Icon = menu.ikon;
                  return (
                    <button key={menu.id} onClick={() => handleMenuClick(menu)} className={`flex flex-col items-center justify-center p-4 rounded-xl hover:bg-gray-50 transition ${activeMenu === menu.nama ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className={`${menu.warna} w-14 h-14 rounded-full flex items-center justify-center mb-3`}>
                        <Icon size={28} className="text-white" />
                      </div>
                      <span className="font-medium text-gray-800 text-center">{menu.nama}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Information */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {/* Today's Schedule */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Clock className="mr-2" size={24} />
                    Kegiatan Hari Ini
                  </h3>
                  <span className="text-sm text-gray-500">{formatDate(new Date())}</span>
                </div>
                
                {kegiatan_hari_ini.length > 0 ? (
                  <div className="space-y-4">
                    {kegiatan_hari_ini.map((kegiatan, index) => (
                      <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <div className="w-20 text-blue-700 font-medium">
                          {formatTime(kegiatan.waktu_mulai)} - {formatTime(kegiatan.waktu_selesai)}
                        </div>
                        <div className="flex-1 ml-4">
                          <p className="font-medium">{kegiatan.nama}</p>
                          {kegiatan.penanggung_jawab && (
                            <p className="text-sm text-gray-600">{kegiatan.penanggung_jawab}</p>
                          )}
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada kegiatan hari ini</p>
                  </div>
                )}
                
                <button onClick={() => navigate("/santri/kegiatan")} className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition flex items-center justify-center">
                  Lihat Jadwal Lengkap <ChevronRight size={20} className="ml-2" />
                </button>
              </div>

              {/* Riwayat Pengaduan */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <AlertCircle className="mr-2" size={24} />
                    Riwayat Pengaduan
                  </h3>
                  {pengaduanList.length > 0 && (
                    <span className="text-sm text-blue-600 font-medium">{pengaduanList.length} total</span>
                  )}
                </div>
                
                {/* LOGIC BARU: Cek panjang array pengaduanList */}
                {pengaduanList.length > 0 ? (
                  <div className="space-y-4">
                    {pengaduanList.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{item.deskripsi}</h4>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                              {item.status}
                           </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-xs text-gray-500">{formatDate(item.waktu)}</span>
                           <button 
                              onClick={() => navigate("/santri/pengaduan")} 
                              className="text-xs font-semibold text-blue-600 hover:underline"
                           >
                              Lihat Detail
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada pengaduan</p>
                  </div>
                )}
                
                {/* Tombol Lihat Semua hanya muncul jika ada data */}
                {pengaduanList.length > 0 && (
                    <button onClick={() => navigate("/santri/pengaduan")} className="w-full mt-4 py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition">
                      Lihat Semua Pengaduan
                    </button>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <History className="mr-2" size={24} />
                  Aktivitas Terakhir
                </h3>
                
                {aktivitasArray.length > 0 ? (
                  <div className="space-y-4">
                    {aktivitasArray.slice(0, 3).map((aktivitas, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{aktivitas.deskripsi}</p>
                            <p className="text-sm text-gray-500">{aktivitas.tanggal}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(aktivitas.status)} flex items-center ml-2 flex-shrink-0`}>
                            <span className="mr-1">{getStatusIcon(aktivitas.status)}</span>
                            {aktivitas.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{aktivitas.jenis}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada aktivitas</p>
                  </div>
                )}
                
                <button onClick={() => navigate("/santri/riwayat")} className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition flex items-center justify-center">
                  Lihat Semua Aktivitas <ChevronRight size={20} className="ml-2" />
                </button>
              </div>
              
            </div>
          </div>

          {/* Right Column: Financial Status & Recent Activity */}
          <div className="space-y-6">
            {/* Financial Status */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <CreditCard className="mr-2" size={24} />
                Status Tagihan
              </h3>
              
              <div className="space-y-4">                
                <div className={`p-4 rounded-xl ${keuangan.tagihan_terakhir.status === 'Lunas' ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Status</p>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(keuangan.tagihan_terakhir.status)} flex items-center`}>
                          <span className="mr-2">{getStatusIcon(keuangan.tagihan_terakhir.status)}</span>
                          {keuangan.tagihan_terakhir.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(keuangan.tagihan_terakhir.jumlah)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {keuangan.tagihan_terakhir.jatuh_tempo && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-gray-600 mb-1">Jatuh Tempo</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatDate(keuangan.tagihan_terakhir.jatuh_tempo)}
                    </p>
                  </div>
                )}
              </div>
              
              <button onClick={() => navigate("/santri/keuangan")} className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
                Lihat Detail Keuangan
              </button>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Statistik</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Jumlah Pengaduan</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {statistik.jumlah_pengaduan || 0}
                      </p>
                    </div>
                    <AlertCircle className="text-blue-600" size={32} />
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Observasi Kesehatan</p>
                      <p className="text-3xl font-bold text-green-700">
                        {statistik.jumlah_observasi || 0}
                      </p>
                    </div>
                    <User className="text-green-600" size={32} />
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-1">Screening</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {statistik.jumlah_screening || 0}
                      </p>
                    </div>
                    <FileText className="text-purple-600" size={32} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-100 md:hidden">
              <div className="flex justify-around">
                <button onClick={() => setActiveMenu('home')} className={`flex flex-col items-center p-2 ${activeMenu === 'home' ? 'text-blue-600' : 'text-gray-600'}`}>
                  <Home size={24} />
                  <span className="text-xs mt-1">Beranda</span>
                </button>
                <button onClick={() => navigate("/santri/profil")} className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
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
        </div>
      </div>
    </div>
  );
}