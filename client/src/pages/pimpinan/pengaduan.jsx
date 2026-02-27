import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Loader2, Plus, CheckCircle, Search, AlertTriangle, X 
} from 'lucide-react';

// Import Modals
import DetailPengaduanModal from '../../components/DetailPengaduanModal';

export default function UstadzPengaduan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Modal states
  const [selectedId, setSelectedId] = useState(null);

  const api = axios.create({ baseURL: "http://localhost:3000/api/pimpinan/pengaduan" });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/");
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

  const filteredData = data.filter(item => {
      const matchSearch = 
        (item.judul?.toLowerCase() || "").includes(search.toLowerCase()) || 
        (item.santri?.nama?.toLowerCase() || "").includes(search.toLowerCase());
      
      const matchStatus = filterStatus === "Semua" || item.status === filterStatus;

      return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[11000] min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header Page */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Pengaduan</h1>
          <p className="text-gray-500 text-sm">Laporkan pelanggaran & kedisiplinan</p>
        </div>
      </div>

      {/* Kontainer Search & Filter Chip */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-green-500 outline-none">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Cari berdasarkan judul laporan atau nama santri..." 
                className="w-full pl-10 pr-4 py-2.5 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
                <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 transition"
                    title="Hapus pencarian"
                >
                    <X size={18} />
                </button>
            )}
          </div>
        </div>

        {/* --- CHIP FILTERS --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {['Semua', 'Aktif', 'Selesai'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                filterStatus === status 
                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* List Pengaduan */}
      <div className="space-y-4 pb-10">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedId(item.id)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-orange-500'}`}></div>

              <div className="flex gap-4 items-start pl-2">
                
                <div className="flex-shrink-0 pt-1">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100 overflow-hidden">
                      {item.santri.foto_profil ? (
                          <img 
                              src={`http://localhost:3000/foto-profil/${item.santri.foto_profil}`} 
                              alt={item.santri.nama}
                              className="w-full h-full object-cover" 
                          />
                      ) : (
                          <User size={20} className="text-orange-500" />
                      )}
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
                    <div className={`flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${item.status === 'Selesai' ? 'text-green-700 bg-green-50 border border-green-100' : 'text-orange-700 bg-orange-50 border border-orange-100'}`}>
                      {item.status || 'Aktif'}
                    </div>
                    {/* Tampilkan Nama Pelapor */}
                    <div className="text-xs font-medium text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        Dilaporkan oleh: {item.pelapor}
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
          <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Tidak ada laporan</h3>
              <p className="text-gray-500 text-sm mt-1">Tidak ada pengaduan yang cocok dengan pencarian atau filter.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {selectedId && (
        <DetailPengaduanModal 
          idAduan={selectedId} 
          onClose={() => setSelectedId(null)} 
          role="pimpinan" 
        />
      )}
    </div>
  );
}