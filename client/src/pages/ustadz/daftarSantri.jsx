import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { 
  ArrowLeft, Loader2, Search, User, ShieldAlert, CheckCircle, X, AlertTriangle 
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

import DetailSantriModal from "../../components/DetailSantriModal";
import PengaduanSantriModal from "../../components/PengaduanSantriModal";

export default function DaftarSantri() {
  const [loading, setLoading] = useState(true);
  const [santris, setSantris] = useState([]);
  const { message, showAlert, clearAlert } = useAlert();
  
  const [search, setSearch] = useState("");
  
  // State Tabs & Filters
  const [activeTab, setActiveTab] = useState("semua"); // "semua" | "kelasku"
  const [selectedKelas, setSelectedKelas] = useState("all"); // Menyimpan ID Kelas yang di-klik
  const [metaInfo, setMetaInfo] = useState({ is_wali_kelas: false, kelas_binaan: [] });

  // State Modals (Tetap sama)
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPengaduanOpen, setIsPengaduanOpen] = useState(false);
  const [riwayatPengaduan, setRiwayatPengaduan] = useState([]);
  const [loadingPengaduan, setLoadingPengaduan] = useState(false);

  const navigate = useNavigate();

  // Fetch API dipicu oleh perubahan Tab ATAU perubahan Sub-Filter Kelas
  useEffect(() => {
    fetchSantri();
  }, [activeTab, selectedKelas]); 

  const fetchSantri = async () => {
    try {
      setLoading(true);
      // Kirim parameter id_kelas juga ke backend
      const res = await api.get(`/ustadz/santri/?search=${search}&filter=${activeTab}&id_kelas=${selectedKelas}`);
      if (res.data.success) {
        setSantris(res.data.data);
        setMetaInfo(res.data.meta);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat daftar santri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => { fetchSantri(); }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Handlers Modals (Tetap sama)
  const handleOpenDetail = (santri) => {
    setSelectedSantri(santri);
    setIsDetailOpen(true);
  };

  const handleOpenPengaduan = async (santri) => {
    setSelectedSantri(santri);
    setIsPengaduanOpen(true);
    setLoadingPengaduan(true);
    try {
        const res = await api.get(`/ustadz/santri/${santri.id}/pengaduan`);
        if (res.data.success) {
            setRiwayatPengaduan(res.data.data);
        }
    } catch (err) {
        showAlert("error", "Gagal memuat riwayat pengaduan");
    } finally {
        setLoadingPengaduan(false);
    }
  };

  const getKehadiranColor = (persen) => {
      if (persen >= 80) return "bg-green-100 text-green-700 border-green-200";
      if (persen >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200";
      return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      <AlertToast message={message} onClose={clearAlert} />

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-40 shadow-lg md:pb-32">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/ustadz")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">Daftar Santri</h1>
              <p className="text-green-100 text-sm truncate">Monitoring profil dan aktivitas santri</p>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 relative z-10 md:-mt-24 space-y-6">
        
        {/* Kontrol Pencarian & Filter Kelas */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            
            {/* Tab Utama */}
            {metaInfo.is_wali_kelas && (
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => {
                            setActiveTab("semua");
                            setSelectedKelas("all"); // Reset sub-filter
                        }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'semua' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Semua Santri
                    </button>
                    <button 
                        onClick={() => setActiveTab("kelasku")}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'kelasku' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Santri Kelasku
                    </button>
                </div>
            )}

            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari nama atau NIS santri..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-800 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>

            {/* Sub-Filter Kelas (Muncul HANYA jika tab 'kelasku' aktif) */}
            {activeTab === 'kelasku' && metaInfo.kelas_binaan && metaInfo.kelas_binaan.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedKelas("all")}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${selectedKelas === "all" ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        Semua Kelas
                    </button>
                    {metaInfo.kelas_binaan.map(kelas => (
                        <button
                            key={kelas.id}
                            onClick={() => setSelectedKelas(kelas.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${selectedKelas === kelas.id ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {kelas.kelas}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* List Santri */}
        {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-green-500" /></div>
        ) : santris.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {santris.map((santri) => (
                    <div key={santri.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                {santri.foto_profil && santri.foto_profil !== '-' ? (
                                    <img src={`/foto-profil/${santri.foto_profil}`} className="w-full h-full object-cover" alt={santri.nama}/>
                                ) : (
                                    <User size={24} className="text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 truncate">{santri.nama}</h3>
                                <p className="text-xs text-gray-500 truncate">NIS: {santri.nip}</p>
                                <p className="text-xs text-gray-500 mb-2 truncate">{santri.kelas}</p>
                                
                                <div className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${getKehadiranColor(santri.kehadiran)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                                    Kehadiran: {santri.kehadiran}%
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
                            <button 
                                onClick={() => handleOpenDetail(santri)}
                                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition"
                            >
                                Lihat Profil
                            </button>
                            <button 
                                onClick={() => handleOpenPengaduan(santri)}
                                className="w-full py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-lg transition flex items-center justify-center"
                            >
                                <ShieldAlert size={14} className="mr-1" /> Laporan
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Data santri tidak ditemukan.</p>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <DetailSantriModal 
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          data={selectedSantri}
      />

      <PengaduanSantriModal 
          isOpen={isPengaduanOpen}
          onClose={() => setIsPengaduanOpen(false)}
          dataSantri={selectedSantri}
          riwayatPengaduan={riwayatPengaduan}
          loading={loadingPengaduan}
      />

    </div>
  );
}