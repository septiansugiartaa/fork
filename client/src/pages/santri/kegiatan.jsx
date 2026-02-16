import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Loader2, Search, Calendar, Clock, MapPin, ChevronDown, 
  AlertTriangle, CheckCircle, X 
} from "lucide-react";

// Import Modals
import DetailKegiatanModal from "../../components/DetailKegiatanModal";
import FeedbackModal from "../../components/FeedbackModal";

export default function KegiatanSantri() {
  const [loading, setLoading] = useState(true);
  const [kegiatans, setKegiatans] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Filter State
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua"); // Semua, Mendatang, Selesai

  // Modal State
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/santri/kegiatan"; 

  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

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
    fetchKegiatan();
  }, [filterType]); // Refetch kalau filter ganti

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      // Query Params: ?search=...&type=...
      const res = await api.get(`/?search=${search}&type=${filterType === "Semua" ? "" : filterType}`);
      if (res.data.success) {
        setKegiatans(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat daftar kegiatan");
    } finally {
      setLoading(false);
    }
  };

  // Debounce Search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchKegiatan();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Handlers Modal
  const handleOpenDetail = (item) => {
    setSelectedKegiatan(item);
    setIsDetailOpen(true);
  };

  const handleOpenFeedback = (item) => {
    // Detail modal tetep open di belakang (opsional, bisa diclose juga)
    // setIsDetailOpen(false); 
    setSelectedKegiatan(item);
    setIsFeedbackOpen(true);
  };

  const handleSubmitFeedback = async (idKegiatan, rating, isiText) => {
    setIsSaving(true);
    try {
        const res = await api.post("/feedback", {
            id_kegiatan: idKegiatan,
            rating: rating,
            isi_text: isiText
        });

        if (res.data.success) {
            showAlert("success", "Feedback berhasil dikirim!");
            setIsFeedbackOpen(false);
            setIsDetailOpen(false);
            fetchKegiatan(); // Refresh data biar tombol feedback hilang
        }
    } catch (err) {
        console.error(err);
        showAlert("error", err.response?.data?.message || "Gagal mengirim feedback");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading && kegiatans.length === 0) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      
      {/* Alert */}
      {message.text && (
        <div className={`fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-[11000] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 pb-40 shadow-lg md:pb-24">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/santri")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0"><h1 className="text-2xl font-bold truncate">Daftar Kegiatan</h1><p className="text-blue-100 text-sm truncate">Informasi agenda dan kegiatan santri</p></div>
        </div>
      </div>

      {/* Content List */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 space-y-8 relative z-10 md:-mt-16">
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari Kegiatan..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm text-gray-800 focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            
            <div className="relative">
                <select 
                    className="w-full pl-4 pr-10 py-3 rounded-xl border-none shadow-sm text-gray-800 appearance-none focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer bg-white"
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

        <h2 className="text-lg font-bold text-gray-800 mb-4 hidden md:block">Kegiatan Mendatang & Riwayat</h2>

        {kegiatans.length > 0 ? (
            kegiatans.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Placeholder Gambar */}
                    <div className="w-full md:w-48 h-40 bg-blue-50 rounded-xl flex-shrink-0 flex items-center justify-center text-blue-500">
                        <Calendar size={32} strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex-1 w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.nama}</h3>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><Calendar size={14} className="mr-2" /> {item.tanggal}</p>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><MapPin size={14} className="mr-2" /> {item.lokasi}</p>
                        <p className="text-gray-500 text-sm mb-4 flex items-center"><Clock size={14} className="mr-2" /> {item.waktu}</p>
                        
                        <button 
                            onClick={() => handleOpenDetail(item)}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Lihat Rincian
                        </button>
                    </div>
                </div>
            ))
        ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500">Tidak ada kegiatan ditemukan.</p>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      <DetailKegiatanModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedKegiatan}
        onFeedbackClick={handleOpenFeedback}
      />

      <FeedbackModal 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        item={selectedKegiatan}
        onSubmit={handleSubmitFeedback}
        saving={isSaving}
      />

    </div>
  );
}