import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';
import { 
  ArrowLeft, User, Loader2, Plus, CheckCircle, Search, AlertTriangle, X 
} from 'lucide-react';

// Import Modals
import DetailPengaduanModal from '../../components/DetailPengaduanModal'; 
import CreatePengaduanModal from '../../components/CreatePengaduanModal';

export default function UstadzPengaduan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Search state
  const [search, setSearch] = useState("");

  // Modal states
  const [selectedId, setSelectedId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && data.length > 0 && location.state?.openAduanId) {
      
      const targetId = location.state.openAduanId;
      
      const isExist = data.find(item => item.id === targetId);
      
      if (isExist) {
        setSelectedId(targetId);
        
        window.history.replaceState({}, document.title);
      }
    }
  }, [loading, data, location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/ustadz/pengaduan/");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat daftar pengaduan");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (formData) => {
    setIsSaving(true);
    try {
        const res = await api.post("/ustadz/pengaduan/", formData);
        if (res.data.success) {
            showAlert("success", res.data.message);
            setIsCreateOpen(false);
            fetchData(); // Refresh list setelah buat baru
        }
    } catch (err) {
        showAlert("error", err.response?.data?.message || "Gagal membuat pengaduan");
    } finally {
        setIsSaving(false);
    }
  };

  // Filter local untuk search bar
  const filteredData = data.filter(item => 
      item.judul.toLowerCase().includes(search.toLowerCase()) || 
      item.santri.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 w-full overflow-x-hidden">
      
      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-[11000] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})}><X size={18} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-40 shadow-lg relative md:pb-32">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/ustadz")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition">
                <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">Kelola Pengaduan</h1>
                <p className="text-green-100 text-sm truncate">Laporkan pelanggaran & kedisiplinan</p>
            </div>
          </div>
          <button 
                onClick={() => setIsCreateOpen(true)}
                className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold transition items-center shadow-md border border-orange-400"
            >
                <Plus size={20} className="mr-2" /> Buat Laporan Baru
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10 md:-mt-24 space-y-4">
        
        {/* Mobile Create Button */}
        <button 
            onClick={() => setIsCreateOpen(true)}
            className="w-full md:hidden flex justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3.5 rounded-xl font-bold transition items-center shadow-lg"
        >
            <Plus size={20} className="mr-2" /> Buat Laporan Baru
        </button>

        {/* Search Bar */}
        <div className="relative">
            <input 
                type="text" 
                placeholder="Cari berdasarkan judul laporan atau nama santri..." 
                className="w-full bg-white pl-11 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none focus:bg-white transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute left-4 top-4.5 text-gray-400" size={20} />
        </div>

        {/* List Pengaduan */}
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                <Loader2 className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-2"/>
                <p className="text-gray-500">Memuat data pengaduan...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedId(item.id)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Garis Status Kiri */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-orange-500'}`}></div>

                <div className="flex gap-4 items-start pl-2">
                  
                  {/* Foto Santri (Menggantikan foto pelapor karena Ustadz ingin lihat siapa yang dilaporkan) */}
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100 overflow-hidden">
                       <User size={20} className="text-orange-500" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                             <span className="font-semibold text-gray-700">Santri: {item.santri.nama}</span>
                             <span>•</span>
                             <span>{item.waktu}</span>
                          </p>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition">
                            {item.judul}
                          </h3>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3 mt-1">
                      {item.deskripsi}
                    </p>

                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50 mt-2">
                      <div className={`flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${item.status === 'Selesai' ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'}`}>
                        {item.status || 'Aktif'}
                      </div>
                      {item.jumlah_tanggapan > 0 && (
                        <div className="text-xs font-medium text-gray-400 ml-auto flex items-center">
                            💬 {item.jumlah_tanggapan} Diskusi
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-bold text-gray-800">Tidak ada laporan</h3>
               <p className="text-gray-500 text-sm mt-1">Anda belum pernah membuat laporan atau tidak ada yang cocok dengan pencarian.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {selectedId && (
        <DetailPengaduanModal 
          idAduan={selectedId} 
          onClose={() => setSelectedId(null)} 
          // Opsional: Jika kamu ingin modal chat tahu bahwa yang login adalah ustadz
          role="ustadz" 
        />
      )}

      <CreatePengaduanModal 
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
          isSaving={isSaving}
      />

    </div>
  );
}