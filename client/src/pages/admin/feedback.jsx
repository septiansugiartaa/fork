import React, { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Search, Loader2, AlertTriangle, CheckCircle, X, Star, MessageSquare
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";
import DetailFeedbackModal from "../../components/DetailFeedbackModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function Feedback() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { message, showAlert, clearAlert } = useAlert();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (currentUser.role || "pengurus").toLowerCase().replace(/\s/g, '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${userRole}/feedback`);
      if (res.data.success) {
        setDataList(res.data.data);
      }
    } catch (err) {
      showAlert("error", "Gagal memuat daftar feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = dataList.filter(item => {
    const matchSearch = (item.judul?.toLowerCase() || "").includes(search.toLowerCase());
    const matchType = filterType === "Semua" || item.tipe === filterType;
    return matchSearch && matchType;
  });

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(filteredData, 10);

  useEffect(() => {
    jump(1);
  }, [filterType, search, dataList]);

  const handleOpenDetail = (item) => {
    setSelectedItem({ id: item.id, tipe: item.tipe });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 relative">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ulasan & Feedback</h1>
          <p className="text-gray-500 text-sm">Pantau tingkat kepuasan layanan dan kegiatan pesantren</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 outline-none">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 text-gray-400" size={18} />
            <input type="text" placeholder="Cari berdasarkan nama kegiatan atau layanan..." className="w-full pl-10 pr-4 py-1.5 outline-none bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {['Semua', 'Kegiatan', 'Layanan'].map((tipe) => (
            <button key={tipe} onClick={() => setFilterType(tipe)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${filterType === tipe ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600'}`}>{tipe}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
          <p className="text-gray-500">Memuat data ulasan...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
                    <th className="p-4 w-[35%] pl-6">Judul</th>
                    <th className="p-4 w-[15%]">Tipe</th>
                    <th className="p-4 w-[15%]">Tanggal</th>
                    <th className="p-4 w-[20%]">Rating Rata-rata</th>
                    <th className="p-4 text-center w-[15%] pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr key={`${item.tipe}-${item.id}`} className="hover:bg-gray-50 transition">
                        <td className="p-4 pl-6 font-bold text-gray-800">{item.judul}</td>
                        <td className="p-4"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${item.tipe === 'Kegiatan' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>{item.tipe}</span></td>
                        <td className="p-4 text-sm text-gray-600">{item.tanggal}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-gray-700">{item.avg_rating}</span>
                            <span className="text-xs text-gray-400">({item.total_ulasan} ulasan)</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <button onClick={() => handleOpenDetail(item)} className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg text-sm font-medium transition">
                            <MessageSquare size={16} /> Lihat
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">Tidak ada ulasan yang cocok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <div key={`${item.tipe}-${item.id}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{item.judul}</h3>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${item.tipe === 'Kegiatan' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>{item.tipe}</span>
                  </div>
                  <div className="text-xs text-gray-500">Diselenggarakan: {item.tanggal}</div>
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <Star size={18} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-black text-gray-800 text-lg leading-none">{item.avg_rating}</span>
                      <span className="text-xs text-gray-400 ml-1">({item.total_ulasan} ulasan)</span>
                    </div>
                    <button onClick={() => handleOpenDetail(item)} className="p-2 bg-green-50 text-green-600 rounded-lg"><MessageSquare size={18} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">Tidak ada ulasan yang cocok.</div>
            )}
          </div>

          {maxPage > 0 && <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />}
        </>
      )}

      <DetailFeedbackModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetItem={selectedItem}
          role="admin"
          onFeedbackHidden={fetchData}
      />
    </div>
  );
}