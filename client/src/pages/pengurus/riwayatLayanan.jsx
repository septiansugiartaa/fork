import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, Eye, Loader2, Calendar, User, 
  AlertTriangle, CheckCircle, X, Star, ChevronLeft, ChevronRight 
} from "lucide-react";
import DetailRiwayatModal from "../../components/DetailRiwayatLayananPengurusModal";
import ProsesLayananModal from "../../components/ProsesLayananModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function RiwayatLayanan() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Custom Hook Pagination
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList, 10);

  // State Modals
  const [detailData, setDetailData] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [processData, setProcessData] = useState(null);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });
  const API_URL = "http://localhost:3000/api/pengurus/riwayat-layanan";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDataList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data riwayat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
        fetchData();
        jump(1); // Reset page ke 1 saat search berubah
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  // Handler Buka Detail
  const handleOpenDetail = (item) => {
    setDetailData(item);
    setIsDetailOpen(true);
  };

  // Handler Buka Proses 
  const handleOpenProcess = (item) => {
    setIsDetailOpen(true);
    setProcessData(item);
    setIsProcessOpen(true);
  };

  // Handler Submit Proses
  const handleSubmitProcess = async (id, formData) => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem("token");
        await axios.put(`${API_URL}/${id}/status`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        showAlert("success", "Status layanan berhasil diperbarui");
        setIsProcessOpen(false);
        fetchData();
    } catch (err) {
        console.error(err);
        showAlert("error", "Gagal memperbarui status");
    } finally {
        setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const s = status || "Proses"; 
    const styles = {
        'Selesai': 'bg-green-100 text-green-700',
        'Proses': 'bg-green-100 text-green-700',
        'Batal': 'bg-red-100 text-red-700'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[s] || 'bg-gray-100 text-gray-600'}`}>
            {s}
        </span>
    );
  };

  return (
    <div className="space-y-6 relative">
        
      {/* Alert */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})}><X size={18}/></button>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Layanan</h1>
            <p className="text-gray-500 text-sm">Monitoring pengajuan layanan santri</p>
        </div>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-green-500 outline-none">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari riwayat layanan..." 
              className="w-full pl-10 pr-4 py-2.5 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="animate-spin text-green-500 mx-auto mb-2"/><p>Loading...</p></div>
      ) : (
        <>
            {/* VIEW 1: TABLE (Desktop) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
                                <th className="p-4">Waktu & Layanan</th>
                                <th className="p-4">Santri</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Rating</th> 
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentData.length > 0 ? currentData.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-4 pl-4">
                                        <p className="font-bold text-gray-800">{item.jenis_layanan.nama_layanan}</p>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <Calendar size={12} className="mr-1"/> {formatDate(item.waktu)}
                                        </div>
                                    </td>
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                                {item.users.foto_profil ? (
                                                    <img src={`http://localhost:3000/foto-profil/${item.users.foto_profil}`} alt={item.users.nama} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <span className="text-green-600 font-bold text-sm bg-green-100 w-full h-full flex items-center justify-center">
                                                        {item.users.nama.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{item.users.nama}</p>
                                                <p className="text-xs text-gray-500">{item.users.nip}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(item.status_sesudah)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.feedback && item.feedback.length > 0 ? (
                                            <div className="flex items-center justify-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 w-fit mx-auto">
                                                <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                                <span className="text-sm font-bold text-yellow-700">{item.feedback[0].rating}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleOpenDetail(item)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition border border-green-100 hover:border-green-300" 
                                            title="Lihat Detail & Feedback"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW 2: CARD (Mobile) */}
            <div className="block md:hidden space-y-4">
                {currentData.length > 0 ? currentData.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                                    {item.users.foto_profil ? (
                                        <img src={`http://localhost:3000/foto-profil/${item.users.foto_profil}`} className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold">{item.users.nama.charAt(0)}</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">{item.jenis_layanan.nama_layanan}</h3>
                                    <p className="text-xs text-gray-500">{item.users.nama}</p>
                                </div>
                            </div>
                            {getStatusBadge(item.status_sesudah)}
                        </div>

                        <div className="border-t border-gray-100"></div>

                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-gray-600 gap-1">
                                <Calendar size={14}/> {formatDate(item.waktu)}
                            </div>
                            {item.feedback && item.feedback.length > 0 && (
                                <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-1 rounded-full">
                                    <Star size={12} fill="currentColor"/> {item.feedback[0].rating}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => handleOpenDetail(item)}
                            className="w-full py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
                        >
                            <Eye size={16}/> Lihat Detail
                        </button>
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

      {/* Modal Detail (Sudah termasuk feedback) */}
      <DetailRiwayatModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        data={detailData} 
        onProcess={handleOpenProcess}
      />

      <ProsesLayananModal
        isOpen={isProcessOpen}
        onClose={() => setIsProcessOpen(false)}
        data={processData}
        onSubmit={handleSubmitProcess}
        saving={isSaving}
      />

    </div>
  );
}