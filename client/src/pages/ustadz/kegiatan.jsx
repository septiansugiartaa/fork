import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { 
  ArrowLeft, Loader2, Search, Calendar, Clock, MapPin, ChevronDown, 
  AlertTriangle, CheckCircle, X, Plus, Users, Globe, BedDouble
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

import DetailKegiatanModal from "../../components/DetailKegiatanModal";
import CreateKegiatanModal from "../../components/CreateKegiatanModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

export default function Kegiatan() {
  const [loading, setLoading] = useState(true);
  const [kegiatans, setKegiatans] = useState([]);
  const { message, showAlert, clearAlert } = useAlert();
  const [myClasses, setMyClasses] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua");
  const [filterSkala, setFilterSkala] = useState("Semua");

  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchKegiatan();
  }, [filterType]); 

  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ustadz/kegiatan/?search=${search}&type=${filterType === "Semua" ? "" : filterType}`);
      if (res.data.success) {
        setKegiatans(res.data.data);
        if (res.data.list_kelas) setMyClasses(res.data.list_kelas);
        if (res.data.list_kamar) setMyRooms(res.data.list_kamar);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat daftar kegiatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => { fetchKegiatan(); }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenDetail = (item) => {
    setSelectedKegiatan(item);
    setIsDetailOpen(true);
  };

  const handleOpenCreateForm = () => {
    if (myClasses.length === 0 && myRooms.length === 0) {
      showAlert("error", "Anda tidak memiliki kelas atau kamar perwalian aktif.");
      return;
    }
    setSelectedKegiatan(null); 
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item) => {
    if (item.skala && item.skala.includes("Seluruh Pesantren")) {
      showAlert("error", "Anda tidak dapat mengedit kegiatan untuk seluruh pesantren milik Pengurus Pusat.");
      return;
    }
    setIsDetailOpen(false); 
    setSelectedKegiatan(item); 
    setIsFormOpen(true); 
  };

  const handleSubmitForm = async (formData) => {
    setIsSaving(true);
    try {
      let res;
      if (formData.id) {
        res = await api.put(`/ustadz/kegiatan/${formData.id}`, formData);
      } else {
        res = await api.post("/ustadz/kegiatan/", formData);
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

  const [deleteKegiatanModal, setDeleteKegiatanModal] = useState({ isOpen: false, id: null, loading: false });
  const handleDelete = (id) => setDeleteKegiatanModal({ isOpen: true, id, loading: false });
  const confirmDeleteKegiatan = async () => {
    setDeleteKegiatanModal(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/ustadz/kegiatan/${deleteKegiatanModal.id}`);
      showAlert("success", "Kegiatan berhasil dihapus");
      setDeleteKegiatanModal({ isOpen: false, id: null, loading: false });
      setIsDetailOpen(false);
      fetchKegiatan();
    } catch (err) {
      showAlert("error", "Gagal menghapus kegiatan");
      setDeleteKegiatanModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredKegiatans = useMemo(() => {
    if (filterSkala === "Semua") return kegiatans;
    return kegiatans.filter(item => {
      if (filterSkala === "Seluruh Pesantren") {
        return item.skala.includes("Seluruh Pesantren") || item.skala.includes("Global");
      }
      return item.skala.includes(filterSkala);
    });
  }, [kegiatans, filterSkala]);

  // Chip color: kelas = green, kamar = purple
  const chipClass = (active, color = "green") => {
    const map = {
      green: active ? "bg-green-600 text-white border-green-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600",
      blue:  active ? "bg-blue-600 text-white border-blue-600 shadow-md"  : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600",
      purple: active ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-purple-50 hover:text-purple-600",
    };
    return map[color];
  };

  if (loading && kegiatans.length === 0) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-40 shadow-lg md:pb-24">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/ustadz")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">Kelola Kegiatan</h1>
              <p className="text-green-100 text-sm truncate">Jadwal dan agenda pondok</p>
            </div>
          </div>
          <button onClick={handleOpenCreateForm} className="hidden md:flex bg-white text-green-600 hover:bg-green-50 px-4 py-2.5 rounded-xl font-bold transition items-center shadow-sm">
            <Plus size={20} className="mr-2" /> Tambah Kegiatan
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-32 space-y-6 relative z-10 md:-mt-12">
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:-mt-16">
          <div className="relative">
            <input type="text" placeholder="Cari Kegiatan..." className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm text-gray-800 focus:ring-2 focus:ring-green-300 outline-none bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          </div>
          <div className="relative">
            <select className="w-full pl-4 pr-10 py-3 rounded-xl border-none shadow-sm text-gray-800 appearance-none focus:ring-2 focus:ring-green-300 outline-none cursor-pointer bg-white" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="Semua">Semua Waktu</option>
              <option value="Mendatang">Akan Datang</option>
              <option value="Selesai">Selesai</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>

        {/* CHIP FILTER SKALA */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button onClick={() => setFilterSkala("Semua")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${chipClass(filterSkala === "Semua", "green")}`}>
            Semua
          </button>
          <button onClick={() => setFilterSkala("Seluruh Pesantren")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${chipClass(filterSkala === "Seluruh Pesantren", "blue")}`}>
            <Globe size={14}/> Seluruh Pesantren
          </button>

          {/* Chip kelas (hijau) */}
          {myClasses.map((kls) => (
            <button key={`kls-${kls.id}`} onClick={() => setFilterSkala(kls.kelas)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${chipClass(filterSkala === kls.kelas, "green")}`}>
              <Users size={14}/> {kls.kelas}
            </button>
          ))}

          {/* Chip kamar (ungu) */}
          {myRooms.map((kmr) => (
            <button key={`kmr-${kmr.id}`} onClick={() => setFilterSkala(`Kamar: ${kmr.kamar}`)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${chipClass(filterSkala === `Kamar: ${kmr.kamar}`, "purple")}`}>
              <BedDouble size={14}/> {kmr.kamar}
            </button>
          ))}
        </div>

        <button onClick={handleOpenCreateForm} className="w-full md:hidden flex justify-center text-white bg-green-600 hover:bg-green-50 px-4 py-3 rounded-xl font-bold transition items-center shadow-md mb-4">
          <Plus size={20} className="mr-2" /> Tambah Kegiatan Baru
        </button>

        {/* LIST KEGIATAN */}
        {filteredKegiatans.length > 0 ? (
          filteredKegiatans.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                item.skala?.includes('Seluruh Pesantren') ? 'bg-blue-500'
                : item.skala?.includes('Kamar') ? 'bg-purple-500'
                : 'bg-green-500'
              }`}></div>

              <div className="w-full md:w-48 h-30 bg-green-50/50 border border-green-100 rounded-xl flex-shrink-0 flex items-center justify-center text-green-500 ml-2 md:ml-0">
                <Calendar size={32} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 w-full pl-2 md:pl-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.nama}</h3>
                    <p className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      item.skala?.includes('Seluruh Pesantren') ? 'bg-blue-50 text-blue-600 border border-blue-100'
                      : item.skala?.includes('Kamar') ? 'bg-purple-50 text-purple-600 border border-purple-100'
                      : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {item.skala?.includes('Seluruh Pesantren') ? <Globe size={10}/>
                        : item.skala?.includes('Kamar') ? <BedDouble size={10}/>
                        : <Users size={10}/>} {item.skala}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">{item.status_waktu}</span>
                </div>
                <p className="text-gray-500 text-sm mb-1 flex items-center"><Calendar size={14} className="mr-2" /> {item.tanggal}</p>
                <p className="text-gray-500 text-sm mb-1 flex items-center"><Clock size={14} className="mr-2" /> {item.waktu}</p>
                <p className="text-gray-500 text-sm mb-1 flex items-center"><MapPin size={14} className="mr-2" /> {item.lokasi}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenDetail(item)} className="w-full md:w-auto bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold transition mt-3">
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

      <CreateKegiatanModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmitForm} isSaving={isSaving} initialData={selectedKegiatan} myClasses={myClasses} myRooms={myRooms} />
      <DetailKegiatanModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} data={selectedKegiatan} role="ustadz" onEditClick={handleOpenEditForm} onDeleteClick={handleDelete} />
      <ConfirmDeleteModal isOpen={deleteKegiatanModal.isOpen} onClose={() => setDeleteKegiatanModal({ isOpen: false, id: null, loading: false })} onConfirm={confirmDeleteKegiatan} loading={deleteKegiatanModal.loading} itemName="kegiatan ini" />
    </div>
  );
}
