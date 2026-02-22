import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, Users, Loader2, 
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, MapPin, Home 
} from "lucide-react";
import KamarModal from "../../components/KamarModal"; 
import KamarSantriModal from "../../components/KamarSantriModal"; 
import AssignKamarModal from "../../components/AssignKamarModal"; 
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function DataKamar() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList, 10);

  // State Modals
  const [modalKamar, setModalKamar] = useState({ isOpen: false, isEditing: false, data: null });
  const [modalListSantri, setModalListSantri] = useState({ isOpen: false, data: null });
  const [modalAssign, setModalAssign] = useState({ isOpen: false, data: null });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/kamar";

  const showAlert = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: "", text: "" }), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?search=${search}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setDataList(res.data.data);
    } catch { showAlert("error", "Gagal memuat data kamar"); } finally { setLoading(false); }
  };

  useEffect(() => { 
      const delay = setTimeout(() => { 
          fetchData(); 
          jump(1); 
      }, 500); 
      return () => clearTimeout(delay); 
  }, [search, refreshListKey]);

  // --- HANDLERS ---
  const handleSubmitKamar = async (formData) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (modalKamar.isEditing) {
        await axios.put(`${API_URL}/${modalKamar.data.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Data kamar diperbarui");
      } else {
        await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Kamar ditambahkan");
      }
      setModalKamar({ ...modalKamar, isOpen: false }); 
      fetchData();
    } catch { showAlert("error", "Gagal menyimpan"); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus kamar ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showAlert("success", "Kamar dihapus"); fetchData();
    } catch { showAlert("error", "Gagal menghapus"); }
  };

  const handleAssignSubmit = async (formData) => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:3000/api/pengurus/penempatan-kamar", formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Santri berhasil dimasukkan ke kamar");
        setModalAssign({ ...modalAssign, isOpen: false });
        setRefreshListKey(prev => prev + 1);
    } catch (err) { showAlert("error", "Gagal assign santri"); } finally { setIsSaving(false); }
  };

  const handleOpenListSantri = (kamar) => setModalListSantri({ isOpen: true, data: kamar });
  const handleOpenAssign = (kamarData) => setModalAssign({ isOpen: true, data: { kamar: kamarData } });

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Data Kamar</h1><p className="text-gray-500 text-sm">Kelola data asrama & kapasitas</p></div>
        <button onClick={() => setModalKamar({ isOpen: true, isEditing: false, data: null })} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition">
            <Plus size={20}/><span className="ml-2 hidden md:inline">Tambah Kamar</span>
        </button>
      </div>

      {/* Search */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-green-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Kamar..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-green-500 mx-auto mb-2"/><p>Loading...</p></div> : (
        <>
            {/* VIEW 1: TABLE (Desktop) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase"><th className="p-4">Nama Kamar</th><th className="p-4">Kapasitas</th><th className="p-4">Gender</th><th className="p-4">Lokasi</th><th className="p-4 text-center">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? currentData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-semibold text-gray-800">{item.kamar}</td>
                                    <td className="p-4">{item.kapasitas} Orang</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${item.gender === 'Laki_laki' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>{item.gender === 'Laki_laki' ? 'Laki-laki' : 'Perempuan'}</span></td>
                                    <td className="p-4 text-gray-600">{item.lokasi || "-"}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setModalKamar({ isOpen: true, isEditing: true, data: item })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Edit2 size={18}/></button>
                                            <button onClick={() => handleOpenListSantri(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Users size={18}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data kosong.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW 2: CARD (Mobile) */}
            <div className="block md:hidden space-y-4">
                {currentData.length > 0 ? currentData.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    <Home size={18} className="text-gray-400"/> {item.kamar}
                                </h3>
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${item.gender === 'Laki_laki' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>
                                    {item.gender === 'Laki_laki' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-gray-400"/> {item.kapasitas} Orang
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400"/> <span className="truncate">{item.lokasi || "-"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <button onClick={() => setModalKamar({ isOpen: true, isEditing: true, data: item })} className="py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2"><Edit2 size={16}/> Edit</button>
                            <button onClick={() => handleOpenListSantri(item)} className="py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2"><Users size={16}/> Penghuni</button>
                        </div>
                    </div>
                )) : <div className="text-center p-8 bg-white rounded-xl text-gray-500">Data kosong.</div>}
            </div>

            {/* Pagination Controls */}
            <Pagination 
                currentPage={currentPage}
                totalPages={maxPage}
                onNext={next}
                onPrev={prev}
            />
        </>
      )}

      {/* --- MODALS --- */}
      <KamarModal isOpen={modalKamar.isOpen} onClose={() => setModalKamar({ ...modalKamar, isOpen: false })} isEditing={modalKamar.isEditing} editData={modalKamar.data} onSubmit={handleSubmitKamar} saving={isSaving} />
      <KamarSantriModal isOpen={modalListSantri.isOpen} onClose={() => setModalListSantri({ ...modalListSantri, isOpen: false })} kamarData={modalListSantri.data} onAssignClick={handleOpenAssign} refreshTrigger={refreshListKey} />
      <AssignKamarModal isOpen={modalAssign.isOpen} onClose={() => setModalAssign({ ...modalAssign, isOpen: false })} isEditing={false} preSelectedKamar={modalAssign.data?.kamar} onSubmit={handleAssignSubmit} saving={isSaving} />
    </div>
  );
}