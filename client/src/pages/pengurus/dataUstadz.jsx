import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, User, Loader2, Mail, Phone, 
  AlertTriangle, CheckCircle, X, MapPin, ChevronLeft, ChevronRight 
} from "lucide-react";
import InputUstadzModal from "../../components/InputUstadzModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function DataUstadz() {
  const [ustadzList, setUstadzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(ustadzList, 5);

  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // State Alert
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/ustadz";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // 1. Fetch Data
  const fetchUstadz = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUstadzList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data ustadz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchUstadz();
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
        showAlert("success", "Data ustadz diperbarui");
      } else {
        await axios.post(API_URL, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showAlert("success", "Ustadz baru ditambahkan");
      }
      setIsModalOpen(false);
      fetchUstadz(); 
    } catch (err) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan akun ini?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("success", "Akun berhasil dinonaktifkan");
      fetchUstadz();
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Data Ustadz</h1>
            <p className="text-gray-500 text-sm">Kelola data tenaga pengajar</p>
        </div>
        <button 
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-blue-500/30 transition"
        >
            <Plus size={20}/><span className="ml-2 hidden md:inline">Tambah Ustadz</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama atau NIP..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
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
                                <th className="p-4 font-semibold">Nama & NIP</th>
                                <th className="p-4 font-semibold">Kontak</th>
                                <th className="p-4 font-semibold">Alamat</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? (
                                currentData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                                    {item.nama.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{item.nama}</p>
                                                    <p className="text-xs text-gray-500">{item.nip || "Tanpa NIP"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div className="flex items-center gap-2"><Mail size={14} /> {item.email || "-"}</div>
                                                <div className="flex items-center gap-2"><Phone size={14} /> {item.no_hp || "-"}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                                            {item.alamat ? (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="flex-shrink-0"/> <span className="truncate">{item.alamat}</span>
                                                </div>
                                            ) : "-"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Nonaktifkan">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>
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
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                                    {item.nama.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.nama}</h3>
                                    <p className="text-sm text-gray-500 font-medium">NIP: {item.nip || "-"}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400"/> <span>{item.no_hp || "-"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400"/> <span className="truncate">{item.email || "-"}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0"/> <span className="line-clamp-2">{item.alamat || "-"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <button onClick={() => handleEdit(item)} className="py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
                                    <Edit2 size={16}/> Edit
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
                                    <Trash2 size={16}/> Hapus
                                </button>
                            </div>
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

      <InputUstadzModal 
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