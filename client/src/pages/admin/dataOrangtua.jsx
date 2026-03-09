import React, { useState, useEffect } from "react";
import api from "../../config/api";
import { 
  Plus, Search, Edit2, Trash2, Loader2, Phone, 
  AlertTriangle, CheckCircle, X, Users, ExternalLink
} from "lucide-react";
import InputOrtuModal from "../../components/InputOrtuModal";
import ListAnakModal from "../../components/ListAnakModal";
import AssignRelasiModal from "../../components/AssignRelasiModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function DataOrangTua() {
  const [ortuList, setOrtuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);
  
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(ortuList);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  
  const [listAnakModal, setListAnakModal] = useState({ isOpen: false, data: null });
  const [assignModal, setAssignModal] = useState({ isOpen: false, data: null });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const fetchOrtu = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orangtua", { params: { search } });
      setOrtuList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data orang tua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchOrtu();
        jump(1);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, refreshListKey]);

  const handleSubmitBasic = async (formData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/admin/orangtua/${selectedData.id}`, formData);
        showAlert("success", "Data wali berhasil diperbarui");
      } else {
        await api.post("/admin/orangtua", formData);
        showAlert("success", "Data wali baru ditambahkan");
      }
      setIsModalOpen(false);
      fetchOrtu();
    } catch (err) {
      showAlert("error", "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignSubmit = async (payload) => {
      setIsSaving(true);
      try {
          await api.post("/admin/orangtua/assign", payload);
          showAlert("success", "Berhasil menghubungkan data");
          setAssignModal({ isOpen: false, data: null });
          setRefreshListKey(prev => prev + 1); 
          fetchOrtu(); 
      } catch (err) {
          showAlert("error", err.response?.data?.message || "Gagal menghubungkan data");
      } finally {
          setIsSaving(false);
      }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Menghapus akun ini juga akan memutus relasinya dengan santri. Lanjutkan?")) return;
    try {
      await api.delete(`/admin/orangtua/${id}`);
      showAlert("success", "Akun berhasil dinonaktifkan");
      fetchOrtu();
    } catch {
      showAlert("error", "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Data Wali Santri</h1><p className="text-gray-500 text-sm">Kelola akun dan relasi keluarga</p></div>
        <button onClick={() => {setIsEditing(false); setSelectedData(null); setIsModalOpen(true);}} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition">
           <Plus size={20}/><span className="ml-2 hidden md:inline">Tambah Wali</span>
        </button>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama atau No HP..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin text-green-500 mx-auto mb-2" size={32} /></div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[40%]">Nama Wali</th>
                    <th className="p-4 w-[25%]">No WhatsApp</th>
                    <th className="p-4 w-[20%] text-center">Tanggungan</th>
                    <th className="p-4 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center flex-shrink-0">
                            {item.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0"><p className="font-semibold text-gray-800 truncate">{item.nama}</p><p className="text-xs text-gray-500 truncate">{item.email || "Tanpa Email"}</p></div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 flex items-center gap-2 mt-2"><Phone size={14}/> {item.no_hp || "-"}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setListAnakModal({isOpen: true, data: item})} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition">
                            {item.jumlah_anak} Anak <ExternalLink size={14} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {setIsEditing(true); setSelectedData(item); setIsModalOpen(true);}} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data orang tua tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
        </>
      )}

      {/* Input Data Dasar Wali (Modal standar CRUD user) */}
      <InputOrtuModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isEditing={isEditing} editData={selectedData} onSubmit={handleSubmitBasic} saving={isSaving} />
      
      {/* List Anak & Assign */}
      <ListAnakModal isOpen={listAnakModal.isOpen} onClose={() => setListAnakModal({isOpen: false, data: null})} ortuData={listAnakModal.data} refreshTrigger={refreshListKey} onAssignClick={(ortu) => {
          setAssignModal({ isOpen: true, data: ortu });
          setListAnakModal({...listAnakModal, isOpen: false});
      }}/>

      <AssignRelasiModal isOpen={assignModal.isOpen} onClose={() => setAssignModal({isOpen: false, data: null})} mode="santri" baseData={assignModal.data} onSubmit={handleAssignSubmit} saving={isSaving} />

    </div>
  );
}