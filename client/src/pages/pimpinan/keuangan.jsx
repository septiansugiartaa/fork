import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  CreditCard,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Calendar,
} from "lucide-react";
import DaftarPembayaranModal from "../../components/DaftarPembayaranModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function Keuangan() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua"); // State untuk Chip

  // Modals
  const [isListBayarOpen, setIsListBayarOpen] = useState(false);
  const [selectedTagihanId, setSelectedTagihanId] = useState(null);

  const [message, setMessage] = useState({ type: "", text: "" });
  const API_URL = "http://localhost:3000/api/pimpinan/keuangan";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Jika backend sudah punya fitur search lewat query string, biarkan. 
      // Jika tidak, kita tangani lewat client-side filtering di bawah.
      const res = await axios.get(`${API_URL}/tagihan?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  // --- LOGIKA FILTER GABUNGAN (SEARCH + CHIP STATUS) ---
  const filteredData = dataList.filter(item => {
      // 1. Cek Pencarian (Search)
      // Mencari berdasarkan nama santri atau nama tagihan
      const searchTerm = search.toLowerCase();
      const matchSearch = 
        (item.nama_tagihan?.toLowerCase() || "").includes(searchTerm) || 
        (item.users?.nama?.toLowerCase() || "").includes(searchTerm);
      
      // 2. Cek Chip Filter
      // Asumsi default status dari backend adalah "Aktif" jika kosong/null
      const currentStatus = item.status || "Aktif"; 
      const matchStatus = filterStatus === "Semua" || currentStatus === filterStatus;

      // Harus lolos kedua kondisi
      return matchSearch && matchStatus;
  });

  // Custom Hook Pagination (Gunakan filteredData, BUKAN dataList)
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(filteredData, 10); // Asumsi 10 item per halaman

  // Reset pagination ke halaman 1 setiap kali filter atau search berubah
  useEffect(() => {
      jump(1);
  }, [filterStatus, search, dataList]);

  const handleOpenListBayar = (id) => {
    setSelectedTagihanId(id);
    setIsListBayarOpen(true);
  };

  // Helper Formatter
  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
    
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 relative">
      {/* Alert */}
      {message.text && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === "error" ? "border-red-500 text-red-700" : "border-green-500 text-green-700"}`}
        >
          {message.type === "error" ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}{" "}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Keuangan</h1>
          <p className="text-gray-500 text-sm">
            Pantau tagihan pembayaran santri
          </p>
        </div>
      </div>

      {/* Kontainer Search & Filter Chip */}
      <div className="space-y-3">
        {/* Toolbar Search */}
        <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-green-500 outline-none">
            <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari nama santri atau jenis tagihan..."
                    className="w-full pl-10 pr-4 py-2.5 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 transition"
                        title="Hapus pencarian"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>

        {/* --- CHIP FILTERS --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {['Semua', 'Aktif', 'Lunas'].map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                        filterStatus === status 
                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                    }`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
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
                    <th className="p-4 w-[30%]">Santri</th>
                    <th className="p-4 w-[20%]">Tagihan</th>
                    <th className="p-4 w-[15%]">Nominal</th>
                    <th className="p-4 w-[15%]">Jatuh Tempo</th>
                    <th className="p-4 w-[10%]">Status</th>
                    <th className="p-4 text-center w-[10%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-bold text-gray-800">
                            {item.users?.nama || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.users?.nip || "-"}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-800">{item.nama_tagihan}</p>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            {item.jenis_tagihan?.jenis_tagihan || "Umum"}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-700">
                          {formatRupiah(item.nominal)}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(item.batas_pembayaran)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === "Lunas" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {item.status || "Aktif"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenListBayar(item.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Riwayat Pembayaran"
                            >
                              <CreditCard size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        Tidak ada tagihan yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* VIEW 2: CARD (Mobile Only) */}
          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
                >
                  {/* Header: Nama Santri & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">
                        {item.users?.nama?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">
                          {item.users?.nama || "Unknown"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {item.nama_tagihan}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === "Lunas" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.status || "Aktif"}
                    </span>
                  </div>

                  <div className="border-t border-gray-100"></div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Nominal</p>
                      <p className="font-semibold text-gray-700">
                        {formatRupiah(item.nominal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">
                        Jatuh Tempo
                      </p>
                      <div className="flex items-center justify-end gap-1 text-gray-600">
                        <Calendar size={12} />{" "}
                        {formatDate(item.batas_pembayaran)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <button
                      onClick={() => handleOpenListBayar(item.id)}
                      className="py-2 bg-green-50 text-green-600 rounded-lg flex justify-center items-center"
                    >
                      <CreditCard size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">
                Tidak ada tagihan yang cocok dengan filter.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {maxPage > 0 && (
            <Pagination
                currentPage={currentPage}
                totalPages={maxPage}
                onNext={next}
                onPrev={prev}
            />
          )}
        </>
      )}

      {/* Modals */}
      {selectedTagihanId && (
          <DaftarPembayaranModal
            isOpen={isListBayarOpen}
            onClose={() => setIsListBayarOpen(false)}
            idTagihan={selectedTagihanId}
            userRole="pimpinan" 
          />
      )}
    </div>
  );
}