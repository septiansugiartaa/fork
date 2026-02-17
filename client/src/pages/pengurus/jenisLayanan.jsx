import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, List, Loader2, 
  AlertTriangle, CheckCircle, X, ChevronLeft, ChevronRight, Clock, Info 
} from "lucide-react";
import InputJenisLayananModal from "../../components/InputJenisLayananModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function JenisLayanan() {
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(layananList, 10);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // State Alert Inline
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/jenis-layanan";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // 1. Fetch Data
  const fetchLayanan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLayananList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data layanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchLayanan();
        jump(1); // Reset page saat search berubah
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // 2. Handlers Modal
  const handleAdd = () => {
    setIsEditing(false);
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (data) => {
    setIsEditing(true);
    setSelectedData(data);
    setIsModalOpen(true);
  };

  // 3. Submit Handler
  const handleSubmit = async (formData) => {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedData.id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showAlert("success", "Jenis layanan berhasil diperbarui");
      } else {
        await axios.post(API_URL, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showAlert("success", "Layanan baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchLayanan();
    } catch (err) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus layanan ini?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("success", "Layanan berhasil dihapus");
      fetchLayanan();
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6 relative">
        
      {/* Alert */}
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
            <h1 className="text-2xl font-bold text-gray-800">Jenis Layanan</h1>
            <p className="text-gray-500 text-sm">Master data layanan dan biaya</p>
        </div>
        <button 
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-blue-500/30 transition"
        >
            <Plus size={20}/><span className="ml-2 hidden md:inline">Tambah Layanan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Cari nama layanan..." 
                className="w-full pl-10 pr-4 py-2.5 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
            {/* VIEW 1: TABEL (Desktop) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold">Jenis Layanan</th>
                                <th className="p-4 font-semibold">Estimasi Waktu</th>
                                <th className="p-4 font-semibold">Deskripsi</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? (
                                currentData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-semibold text-gray-800">{item.nama_layanan}</td>
                                        <td className="p-4 text-sm text-gray-600">{item.estimasi || "-"} Hari</td>
                                        <td className="p-4 text-sm text-gray-600 max-w-sm truncate">{item.deskripsi || "-"}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data layanan tidak ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW 2: CARD (Mobile) */}
            <div className="block md:hidden space-y-4">
                {currentData.length > 0 ? (
                    currentData.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{item.nama_layanan}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded w-fit">
                                        <Clock size={14} /> {item.estimasi || "-"} Hari
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                            </div>

                            <div className="border-t border-gray-100 pt-2">
                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <Info size={16} className="mt-0.5 flex-shrink-0 text-gray-400"/>
                                    <p className="line-clamp-2">{item.deskripsi || "Tidak ada deskripsi."}</p>
                                </div>
                            </div>

                            <button onClick={() => handleEdit(item)} className="mt-1 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 active:scale-95 transition">
                                <Edit2 size={16}/> Edit Layanan
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 bg-white rounded-xl border border-gray-100 text-gray-500">Data tidak ditemukan</div>
                )}
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

      {/* Modal Form */}
      <InputJenisLayananModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        editData={selectedData}
        onSubmit={handleSubmit}
        saving={isSaving}
      />

    </div>
  );
}