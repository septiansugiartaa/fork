import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, Users, Loader2, 
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight 
} from "lucide-react";
import KelasModal from "../../components/KelasModal"; 
import KelasSantriModal from "../../components/KelasSantriModal"; 
import AssignKelasModal from "../../components/AssignKelasModal"; 
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function DataKelas() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList, 5);

  // Modals State
  const [modalKelas, setKelasModal] = useState({ isOpen: false, isEditing: false, data: null });
  const [modalListSantri, setKelasSantriModal] = useState({ isOpen: false, data: null });
  const [modalAssign, setModalAssign] = useState({ isOpen: false, data: null });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/kelas";

  const showAlert = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage({ type: "", text: "" }), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?search=${search}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setDataList(res.data.data);
    } catch { showAlert("error", "Gagal memuat data kelas"); } finally { setLoading(false); }
  };

  useEffect(() => { 
      const delay = setTimeout(() => { 
          fetchData(); 
          jump(1); // Reset ke halaman 1 saat search berubah
      }, 500); 
      return () => clearTimeout(delay); 
  }, [search, refreshListKey]);

  // Handlers
  const handleSubmitKelas = async (formData) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (modalKelas.isEditing) {
        await axios.put(`${API_URL}/${modalKelas.data.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Kelas diperbarui");
      } else {
        await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Kelas ditambahkan");
      }
      setKelasModal({ ...modalKelas, isOpen: false }); 
      fetchData();
    } catch { showAlert("error", "Gagal menyimpan"); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus kelas ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showAlert("success", "Kelas dihapus"); fetchData();
    } catch { showAlert("error", "Gagal menghapus"); }
  };

  const handleAssignSubmit = async (formData) => {
    setIsSaving(true);
    try {
        await axios.post("http://localhost:3000/api/pengurus/penempatan-kelas", formData, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
        showAlert("success", "Santri berhasil dimasukkan");
        setModalAssign({ ...modalAssign, isOpen: false });
        setRefreshListKey(prev => prev + 1);
    } catch { showAlert("error", "Gagal assign santri"); } finally { setIsSaving(false); }
  };

  const handleOpenListSantri = (kelas) => setKelasSantriModal({ isOpen: true, data: kelas });
  const handleOpenAssign = (kelasData) => setModalAssign({ isOpen: true, data: { kelas: kelasData } });

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Data Kelas</h1><p className="text-gray-500 text-sm">Kelola data kelas & tahun ajaran</p></div>
        <button onClick={() => setKelasModal({ isOpen: true, isEditing: false, data: null })} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition">
            <Plus size={20}/><span className="ml-2 hidden md:inline">Tambah Kelas</span>
        </button>
      </div>

      {/* Search */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Kelas..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-2"/><p>Loading...</p></div> : (
        <>
            {/* VIEW 1: TABLE (Desktop) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase"><th className="p-4">Nama Kelas</th><th className="p-4">Tahun Ajaran</th><th className="p-4">Wali Kelas</th><th className="p-4 text-center">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? currentData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-semibold text-gray-800">{item.kelas}</td>
                                    <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{item.tahun_ajaran}</span></td>
                                    <td className="p-4 text-gray-600">
                                        {item.users ? (
                                            <div className="flex flex-col"><span className="font-medium text-gray-800">{item.users.nama}</span>{item.users.nip && <span className="text-xs text-gray-400">{item.users.nip}</span>}</div>
                                        ) : <span className="text-gray-400 italic text-sm">Belum ditentukan</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => setKelasModal({ isOpen: true, isEditing: true, data: item })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                                            <button onClick={() => handleOpenListSantri(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Users size={18}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data kosong.</td></tr>}
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
                                <h3 className="font-bold text-gray-800 text-lg">{item.kelas}</h3>
                                <span className="inline-block mt-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{item.tahun_ajaran}</span>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-2">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Wali Kelas</p>
                            {item.users ? (
                                <div><p className="text-sm font-semibold text-gray-800">{item.users.nama}</p><p className="text-xs text-gray-400">{item.users.nip}</p></div>
                            ) : <p className="text-sm text-gray-400 italic">Belum ditentukan</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <button onClick={() => setKelasModal({ isOpen: true, isEditing: true, data: item })} className="py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2"><Edit2 size={16}/> Edit</button>
                            <button onClick={() => handleOpenListSantri(item)} className="py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2"><Users size={16}/> Santri</button>
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

      {/* Modals */}
      <KelasModal isOpen={modalKelas.isOpen} onClose={() => setKelasModal({ ...modalKelas, isOpen: false })} isEditing={modalKelas.isEditing} editData={modalKelas.data} onSubmit={handleSubmitKelas} saving={isSaving} />
      <KelasSantriModal isOpen={modalListSantri.isOpen} onClose={() => setKelasSantriModal({ ...modalListSantri, isOpen: false })} kelasData={modalListSantri.data} onAssignClick={handleOpenAssign} refreshTrigger={refreshListKey} />
      <AssignKelasModal isOpen={modalAssign.isOpen} onClose={() => setModalAssign({ ...modalAssign, isOpen: false })} isEditing={false} preSelectedKelas={modalAssign.data?.kelas} onSubmit={handleAssignSubmit} saving={isSaving} />
    </div>
  );
}