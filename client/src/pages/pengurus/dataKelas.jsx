import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Search, Edit2, Trash2, Users, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";
import KelasModal from "../../components/KelasModal"; // Modal CRUD Kelas
import KelasSantriModal from "../../components/KelasSantriModal"; // Modal List Santri
import AssignKelasModal from "../../components/AssignKelasModal"; // Reuse Modal Assign untuk assign baru

export default function DataKelas() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);
  
  // State Modals
  const [modalKelas, setKelasModal] = useState({ isOpen: false, isEditing: false, data: null });
  const [modalListSantri, setKelasSantriModal] = useState({ isOpen: false, data: null });
  const [modalAssign, setModalAssign] = useState({ isOpen: false, data: null }); // Assign santri baru

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

  useEffect(() => { const delay = setTimeout(fetchData, 500); return () => clearTimeout(delay); }, [search]);

  // --- HANDLERS ---

  // 1. Submit Kelas (Create/Edit)
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

  // 2. Delete Kelas
  const handleDelete = async (id) => {
    if (!confirm("Hapus kelas ini? Data santri di dalamnya mungkin akan kehilangan referensi kelas.")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      showAlert("success", "Kelas dihapus"); fetchData();
    } catch { showAlert("error", "Gagal menghapus"); }
  };

  // 3. Submit Assign Santri (Dari Modal Assign)
  const handleAssignSubmit = async (formData) => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:3000/api/pengurus/penempatan-kelas", formData, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        showAlert("success", "Santri berhasil dimasukkan ke kelas");
        setModalAssign({ ...modalAssign, isOpen: false });
        setRefreshListKey(prev => prev + 1);
        
    } catch (err) {
        showAlert("error", "Gagal assign santri");
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenListSantri = (kelas) => {
    setKelasSantriModal({ isOpen: true, data: kelas });
  };

  const handleOpenAssign = (kelasData) => {
    setModalAssign({ isOpen: true, data: { kelas: kelasData } });
  };

  return (
    <div className="space-y-6 relative">
      {/* Alert */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Data Kelas</h1><p className="text-gray-500 text-sm">Kelola data kelas & tahun ajaran</p></div>
        <button onClick={() => setKelasModal({ isOpen: true, isEditing: false, data: null })} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition"><Plus size={20} className="mr-2"/> Tambah Kelas</button>
      </div>

      {/* Search */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari Kelas..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-2"/><p>Loading...</p></div> : (
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase"><th className="p-4">Nama Kelas</th><th className="p-4">Tahun Ajaran</th><th className="p-4">Wali Kelas</th><th className="p-4 text-center">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {dataList.length > 0 ? dataList.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-800">{item.kelas}</td>
                  <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{item.tahun_ajaran}</span></td>
                  <td className="p-4 text-gray-600">
                    {item.users ? (
                      <div className="flex flex-col"><span className="font-medium text-gray-800">{item.users.nama}</span>{item.users.nip && <span className="text-xs text-gray-400">{item.users.nip}</span>}</div>
                    ) : <span className="text-gray-400 italic text-sm">Belum ditentukan</span>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setKelasModal({ isOpen: true, isEditing: true, data: item })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Kelas"><Edit2 size={18}/></button>
                      <button onClick={() => handleOpenListSantri(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Lihat Santri"><Users size={18}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus Kelas"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data kosong.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Modal Create/Edit Kelas */}
      <KelasModal 
        isOpen={modalKelas.isOpen} 
        onClose={() => setKelasModal({ ...modalKelas, isOpen: false })} 
        isEditing={modalKelas.isEditing} 
        editData={modalKelas.data} 
        onSubmit={handleSubmitKelas} 
        saving={isSaving} 
      />

      {/* 2. Modal List Santri */}
      <KelasSantriModal 
        isOpen={modalListSantri.isOpen} 
        onClose={() => setKelasSantriModal({ ...modalListSantri, isOpen: false })} 
        kelasData={modalListSantri.data}
        onAssignClick={handleOpenAssign}
        refreshTrigger={refreshListKey}
      />

      {/* 3. Modal Assign Santri Baru (Re-used) */}
      <AssignKelasModal
        isOpen={modalAssign.isOpen}
        onClose={() => setModalAssign({ ...modalAssign, isOpen: false })}
        isEditing={false} 
        // Pass the class object that was clicked in the list modal
        preSelectedKelas={modalAssign.data?.kelas} 
        onSubmit={handleAssignSubmit}
        saving={isSaving}
      />

    </div>
  );
}