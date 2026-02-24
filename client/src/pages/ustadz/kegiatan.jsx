import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, Loader2, Search, Calendar, Clock, MapPin, ChevronDown, 
  AlertTriangle, CheckCircle, X, Plus, User
} from "lucide-react";

import DetailKegiatanModal from "../../components/DetailKegiatanModal";
import CreateKegiatanModal from "../../components/CreateKegiatanModal";

export default function Kegiatan() {
  const [loading, setLoading] = useState(true);
  const [kegiatans, setKegiatans] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua"); 

  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Diubah jadi isFormOpen biar general
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/ustadz/kegiatan"; 

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
      showAlert("error", "Gagal memuat daftar kegiatan");
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

  // Handlers untuk buka modal
  const handleOpenDetail = (item) => {
    setSelectedKegiatan(item);
    setIsDetailOpen(true);
  };

  const handleOpenCreateForm = () => {
    setSelectedKegiatan(null); // Kosongkan data
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item) => {
    setIsDetailOpen(false); // Tutup detail
    setSelectedKegiatan(item); // Set data yang mau diedit
    setIsFormOpen(true); // Buka form
  };

  // Handler Submit Form (Gabungan POST & PUT)
  const handleSubmitForm = async (formData) => {
    setIsSaving(true);
    try {
        let res;
        if (formData.id) {
            // EDIT
            res = await api.put(`/${formData.id}`, formData);
        } else {
            // CREATE
            res = await api.post("/", formData);
        }

        if (res.data.success) {
            showAlert("success", res.data.message);
            setIsFormOpen(false);
            fetchKegiatan(); 
        }
    } catch (err) {
        console.error(err);
        showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading && kegiatans.length === 0) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      
      {/* Alert Component */}
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
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-40 shadow-lg md:pb-24">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/ustadz")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">Kelola Kegiatan</h1>
                <p className="text-green-100 text-sm truncate">Jadwal dan agenda pondok</p>
            </div>
          </div>
          <button 
            onClick={handleOpenCreateForm}
            className="hidden md:flex bg-white text-green-600 hover:bg-green-50 px-4 py-2.5 rounded-xl font-bold transition items-center shadow-sm"
          >
            <Plus size={20} className="mr-2" /> Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 space-y-6 relative z-10 md:-mt-12">
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:-mt-16">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari Kegiatan..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm text-gray-800 focus:ring-2 focus:ring-green-300 outline-none bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
            
            <div className="relative">
                <select 
                    className="w-full pl-4 pr-10 py-3 rounded-xl border-none shadow-sm text-gray-800 appearance-none focus:ring-2 focus:ring-green-300 outline-none cursor-pointer bg-white"
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

        <button 
            onClick={handleOpenCreateForm}
            className="w-full md:hidden flex justify-center text-white bg-green-600 hover:bg-green-50 px-4 py-3 rounded-xl font-bold transition items-center shadow-md mb-4"
        >
            <Plus size={20} className="mr-2" /> Tambah Kegiatan Baru
        </button>

        {kegiatans.length > 0 ? (
            kegiatans.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="w-full md:w-48 h-30 bg-green-50/50 border border-green-100 rounded-xl flex-shrink-0 flex items-center justify-center text-green-500">
                        <Calendar size={32} strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{item.nama}</h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                {item.status_waktu}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><Calendar size={14} className="mr-2" /> {item.tanggal}</p>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><Clock size={14} className="mr-2" /> {item.waktu}</p>
                        <p className="text-gray-500 text-sm mb-1 flex items-center"><MapPin size={14} className="mr-2" /> {item.lokasi}</p>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleOpenDetail(item)}
                                className="w-full md:w-auto bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold transition mt-3"
                            >
                                Lihat Rincian
                            </button>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada kegiatan ditemukan.</p>
            </div>
        )}
      </div>

      <CreateKegiatanModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitForm}
          isSaving={isSaving}
          initialData={selectedKegiatan} // Diumpankan jika mode Edit, dikosongkan jika mode Create
      />

      <DetailKegiatanModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedKegiatan}
        role="ustadz" 
        onEditClick={handleOpenEditForm} // Sambungkan handler ke tombol Edit di Detail
      />

    </div>
  );
}