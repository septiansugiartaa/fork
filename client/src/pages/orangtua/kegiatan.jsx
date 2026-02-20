import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Loader2, Search, Calendar, Clock, MapPin, ChevronDown, 
  AlertTriangle, CheckCircle, X, UserCheck
} from "lucide-react";
import DetailKegiatanModal from "../../components/DetailKegiatanModal"; // Kita pakai modal yang sama

export default function OrangTuaKegiatan() {
  const [loading, setLoading] = useState(true);
  const [kegiatans, setKegiatans] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua"); 

  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/orangtua/kegiatan"; 

  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    fetchKegiatan();
  }, [filterType]); 

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/?search=${search}&type=${filterType === "Semua" ? "" : filterType}`);
      if (res.data.success) {
        setKegiatans(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Gagal memuat daftar kegiatan anak" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchKegiatan();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenDetail = (item) => {
    setSelectedKegiatan(item);
    setIsDetailOpen(true);
  };

  if (loading && kegiatans.length === 0) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-6 pb-40 shadow-lg md:pb-24">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/orangtua")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">Kegiatan Anak</h1>
              <p className="text-blue-100 text-sm truncate">Monitoring kehadiran dan partisipasi anak</p>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 space-y-8 relative z-10 md:-mt-16">
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari Kegiatan..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 shadow-sm text-gray-800 focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            
            <div className="relative">
                <select 
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-100 shadow-sm text-gray-800 appearance-none focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer bg-white"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="Semua">Semua Waktu</option>
                    <option value="Mendatang">Akan Datang</option>
                    <option value="Selesai">Selesai</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
            </div>
        </div>

        {kegiatans.length > 0 ? (
            kegiatans.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-full md:w-48 h-40 bg-indigo-50 rounded-xl flex-shrink-0 flex items-center justify-center text-indigo-500">
                        <Calendar size={32} strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900 pr-4">{item.nama}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${item.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.status_kehadiran}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><Calendar size={14} className="mr-2" /> {item.tanggal}</p>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><MapPin size={14} className="mr-2" /> {item.lokasi}</p>
                        <p className="text-gray-500 text-sm mb-4 flex items-center"><Clock size={14} className="mr-2" /> {item.waktu}</p>
                        
                        <button 
                            onClick={() => handleOpenDetail(item)}
                            className="w-full md:w-auto bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center"
                        >
                            Lihat Rincian
                        </button>
                    </div>
                </div>
            ))
        ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Tidak ada aktivitas kegiatan anak yang ditemukan.</p>
            </div>
        )}
      </div>

      <DetailKegiatanModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedKegiatan}
      />

    </div>
  );
}