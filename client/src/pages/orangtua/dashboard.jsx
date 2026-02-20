import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Calendar, Cross, AlertCircle, History, Clock, Settings, CheckCircle, Home, LogOut, Loader2, ChevronDown, Wallet } from "lucide-react";

export default function OrangTuaDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:3000/api/orangtua/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  if (!data) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Blue Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-6 pb-20">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">SIM-Tren</h1>
              <p className="text-blue-100">Sistem Informasi Manajemen Pesantren</p>
          </div>
          <div className="relative hidden md:block">
            <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 text-left p-2 rounded-xl hover:bg-white/10 transition focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 transition">
                     <img src={`http://localhost:3000/foto-profil/${data.ortu.foto_profil}`} alt={data.ortu.nama} className="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{data.ortu.nama}</p>
                      <p className="text-sm text-white/75">{data.ortu.hubungan} {data.anak.nama.split(" ")[0]}</p>
                    </div>
                    <ChevronDown 
                      size={16} 
                      className={`text-blue-200 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border py-2 z-50">
                <button onClick={() => {setIsProfileOpen(false); navigate("/orangtua/profil");}} className="w-full flex items-center py-3 px-5 text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition">
                  <Settings size={16} className="mr-2" /> <span className="text-sm font-semibold">Edit Profil</span>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center py-3 px-5 text-red-600 hover:bg-red-50 transition">
                  <LogOut size={16} className="mr-2" /> <span className="text-sm font-semibold">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Anak Card (Floating) */}
      <div className="max-w-6xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-6 border border-white">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
            <img 
              src={`http://localhost:3000/foto-profil/${data.anak.foto_profil}`} 
              className="w-full h-full object-cover" 
              alt="Foto Anak"
              onError={(e) => e.target.src = "https://ui-avatars.com/api/?name=" + data.anak.nama}
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1">Data Anak Anda</p>
            <h2 className="text-2xl font-black text-gray-800">{data.anak.nama}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">NIS: {data.anak.nip}</span>
              <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-bold text-blue-600">{data.anak.kelas}</span>
              <span className="bg-purple-50 px-3 py-1 rounded-full text-xs font-bold text-purple-600">{data.anak.kamar}</span>
            </div>
          </div>
          <button onClick={() => navigate("/orangtua/keuangan")} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition">
            Bayar Tagihan
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          
          {/* Main Info (Left) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Menu Cepat Grid */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 mb-4 px-2">Menu Wali</h3>
              <div className="grid grid-cols-4 gap-2 text-white">
                <MenuButton icon={<Wallet />} label="Keuangan" onClick={() => navigate("/orangtua/keuangan")} color="bg-blue-500" />
                <MenuButton icon={<Calendar />} label="Kegiatan" onClick={() => navigate("/orangtua/kegiatan")} color="bg-purple-500" />
                <MenuButton icon={<AlertCircle />} label="Aduan" onClick={() => navigate("/orangtua/pengaduan")} color="bg-orange-500" />
                <MenuButton icon={<Cross />} label="Scabies" onClick={() => navigate("/orangtua/kesehatan")} color="bg-teal-500" />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <Wallet className="text-blue-500 mb-2" size={24} />
                <p className="text-gray-400 text-xs font-medium">Tagihan Aktif</p>
                <h4 className="text-xl font-black text-gray-800">{data.statistik.tagihan_aktif} Item</h4>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <History className="text-green-500 mb-2" size={24} />
                <p className="text-gray-400 text-xs font-medium">Kehadiran (Hadir)</p>
                <h4 className="text-xl font-black text-gray-800">{data.statistik.kehadiran_total} Kali</h4>
              </div>
            </div>

            {/* Pengaduan List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Pengaduan Terakhir</h3>
                <button onClick={() => navigate("/orangtua/pengaduan")} className="text-blue-600 text-xs font-bold">Lihat Semua</button>
              </div>
              <div className="space-y-3">
                {data.pengaduan_terakhir.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{p.judul || p.deskripsi}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(p.waktu_aduan)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${p.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Info (Right) */}
          <div className="space-y-6 mb-10">
            {/* Tagihan Card */}
            <div className="bg-white rounded-3xl shadow-lg shadow-blue-100 border border-blue-50 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Tagihan Mendesak</h3>
              {data.keuangan.tagihan_pending ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <p className="text-xs text-blue-600 font-bold mb-1 uppercase">{data.keuangan.tagihan_pending.nama}</p>
                    <p className="text-2xl font-black text-gray-800">Rp {data.keuangan.tagihan_pending.nominal.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
                    <Clock size={14} /> Jatuh Tempo: {formatDate(data.keuangan.tagihan_pending.jatuh_tempo)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle className="mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Semua tagihan sudah lunas</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Cross className="text-teal-500" /> Kondisi Kesehatan</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 mb-1 uppercase">Observasi Terakhir</p>
                  <p className="text-sm font-medium text-gray-700">{data.kesehatan.observasi?.catatan || 'Belum ada catatan'}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 mb-1 uppercase">Diagnosa Scabies</p>
                  <p className="text-sm font-bold text-gray-800">{data.kesehatan.screening?.diagnosa || 'Belum Screening'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-100 md:hidden">
        <div className="flex justify-around">
          <button onClick={() => navigate('/orangtua')} className='flex flex-col items-center p-2 text-blue-600'>
            <Home size={24} />
            <span className="text-xs mt-1">Beranda</span>
          </button>
          <button onClick={() => navigate("/orangtua/profil")} className="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600">
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

function MenuButton({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
      <div className={`w-12 h-12 rounded-2xl md:rounded-full flex items-center justify-center mb-3 ${color} md:w-14 md:h-14`}>{icon}</div>
      <span className="text-xs md:text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

function NavIcon({ icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-2 rounded-xl ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
      {icon}
    </button>
  );
}