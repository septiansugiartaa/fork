import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, CreditCard, Loader2, 
  AlertTriangle, CheckCircle, X, ChevronLeft, ChevronRight, User, Calendar
} from "lucide-react";
import InputTagihanModal from "../../components/InputTagihanModal";
import DaftarPembayaranModal from "../../components/DaftarPembayaranModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function Keuangan() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList, 5);

  // Modals
  const [isTagihanOpen, setIsTagihanOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  
  const [isListBayarOpen, setIsListBayarOpen] = useState(false);
  const [selectedTagihanId, setSelectedTagihanId] = useState(null);

  const [message, setMessage] = useState({ type: "", text: "" });
  const API_URL = "http://localhost:3000/api/pengurus/keuangan";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/tagihan?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDataList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data keuangan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
        fetchData();
        jump(1); // Reset page saat search berubah
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  // --- Handlers ---
  const handleCreate = () => {
    setIsEditing(false);
    setSelectedTagihan(null);
    setIsTagihanOpen(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setSelectedTagihan(item);
    setIsTagihanOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus tagihan ini? Data pembayaran terkait mungkin akan terpengaruh.")) return;
    try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/tagihan/${id}`, { headers: { Authorization: `Bearer ${token}` }});
        showAlert("success", "Tagihan dihapus");
        fetchData();
    } catch (err) { showAlert("error", "Gagal menghapus"); }
  };

  const handleOpenListBayar = (id) => {
    setSelectedTagihanId(id);
    setIsListBayarOpen(true);
  };

  const handleSubmitTagihan = async (formData) => {
    try {
        const token = localStorage.getItem("token");
        if (isEditing) {
            await axios.put(`${API_URL}/tagihan/${selectedTagihan.id}`, formData, { headers: { Authorization: `Bearer ${token}` }});
            showAlert("success", "Tagihan diperbarui");
        } else {
            await axios.post(`${API_URL}/tagihan`, formData, { headers: { Authorization: `Bearer ${token}` }});
            showAlert("success", "Tagihan berhasil dibuat");
        }
        setIsTagihanOpen(false);
        fetchData();
    } catch (err) {
        console.error(err);
        showAlert("error", "Gagal menyimpan data");
    }
  };

  // Helper Formatter
  const formatRupiah = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
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
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Keuangan</h1>
            <p className="text-gray-500 text-sm">Kelola tagihan santri dan monitoring pembayaran</p>
        </div>
        <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition">
            <Plus size={20}/><span className="ml-2 hidden md:inline">Buat Tagihan</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Cari tagihan..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
            {/* VIEW 1: TABEL (Desktop Only) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
                                <th className="p-4">Santri</th>
                                <th className="p-4">Tagihan</th>
                                <th className="p-4">Nominal</th>
                                <th className="p-4">Jatuh Tempo</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? currentData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800">{item.users.nama}</p>
                                        <p className="text-xs text-gray-500">{item.users.nip}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-gray-800">{item.nama_tagihan}</p>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.jenis_tagihan?.jenis_tagihan}</span>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-700">{formatRupiah(item.nominal)}</td>
                                    <td className="p-4 text-sm text-gray-600">{formatDate(item.batas_pembayaran)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.status || "Aktif"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleOpenListBayar(item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Riwayat Pembayaran"><CreditCard size={18}/></button>
                                            <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit2 size={18}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="6" className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW 2: CARD (Mobile Only) */}
            <div className="block md:hidden space-y-4">
                {currentData.length > 0 ? currentData.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        {/* Header: Nama Santri & Status */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    {item.users.nama.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">{item.users.nama}</h3>
                                    <p className="text-xs text-gray-500">{item.nama_tagihan}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.status || "Aktif"}
                            </span>
                        </div>

                        <div className="border-t border-gray-100"></div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 mb-0.5">Nominal</p>
                                <p className="font-semibold text-gray-700">{formatRupiah(item.nominal)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 mb-0.5">Jatuh Tempo</p>
                                <div className="flex items-center justify-end gap-1 text-gray-600">
                                    <Calendar size={12}/> {formatDate(item.batas_pembayaran)}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <button onClick={() => handleOpenListBayar(item.id)} className="py-2 bg-green-50 text-green-600 rounded-lg flex justify-center items-center"><CreditCard size={16}/></button>
                            <button onClick={() => handleEdit(item)} className="py-2 bg-blue-50 text-blue-600 rounded-lg flex justify-center items-center"><Edit2 size={16}/></button>
                            <button onClick={() => handleDelete(item.id)} className="py-2 bg-red-50 text-red-600 rounded-lg flex justify-center items-center"><Trash2 size={16}/></button>
                        </div>
                    </div>
                )) : <div className="text-center p-8 bg-white rounded-xl text-gray-500">Data tidak ditemukan</div>}
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
      <InputTagihanModal isOpen={isTagihanOpen} onClose={() => setIsTagihanOpen(false)} isEditing={isEditing} editData={selectedTagihan} onSubmit={handleSubmitTagihan} />
      <DaftarPembayaranModal isOpen={isListBayarOpen} onClose={() => setIsListBayarOpen(false)} idTagihan={selectedTagihanId} />
    </div>
  );
}