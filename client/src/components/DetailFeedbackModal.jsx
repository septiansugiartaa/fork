import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Star, MessageSquare, User } from 'lucide-react';

export default function DetailFeedbackModal({ isOpen, onClose, targetItem }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && targetItem) {
      fetchDetail();
    } else {
      setData(null);
    }
  }, [isOpen, targetItem]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3000/api/pimpinan/feedback/detail/${targetItem.tipe}/${targetItem.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-2xl">
          <div className="pr-4">
             <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="text-green-500" size={18} />
                <h3 className="font-bold text-gray-800 text-lg">Detail Ulasan</h3>
             </div>
             {data && !loading && (
                 <p className="text-sm text-gray-500 line-clamp-1">{data.detail.judul}</p>
             )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm border border-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {loading ? (
             <div className="py-20 text-center flex flex-col items-center">
                 <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
                 <span className="text-gray-500 text-sm">Menarik data ulasan...</span>
             </div>
          ) : data ? (
             <div className="space-y-6">
                
                {/* Summary Card */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
                   <div>
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block ${data.detail.tipe === 'Kegiatan' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                           {data.detail.tipe}
                       </span>
                       <p className="text-xs text-gray-400 mb-1 font-medium">
                          {data.detail.tipe === 'Kegiatan' 
                            ? `Diselenggarakan pada: ${data.detail.tanggal}` 
                            : `Rekapitulasi Data: ${data.detail.tanggal}`}
                       </p>
                   </div>
                   <div className="text-right">
                       <div className="flex items-baseline justify-end gap-1 mb-1">
                           <span className="text-3xl font-black text-gray-800">{data.detail.avg_rating}</span>
                           <span className="text-sm font-bold text-gray-400">/ 5.0</span>
                       </div>
                       <p className="text-xs text-gray-500 font-medium">Dari {data.detail.total_ulasan} Ulasan</p>
                   </div>
                </div>

                {/* List Comments */}
                <div>
                   <h4 className="font-bold text-gray-800 mb-3 text-sm px-1">Semua Komentar</h4>
                   <div className="space-y-3">
                       {data.feedbacks.length > 0 ? data.feedbacks.map(f => (
                           <div key={f.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                               <div className="flex-shrink-0">
                                   <div className="w-10 h-10 bg-green-50 border border-green-100 rounded-full flex items-center justify-center overflow-hidden">
                                       {f.foto_user ? (
                                           <img src={`http://localhost:3000/foto-profil/${f.foto_user}`} alt="" className="w-full h-full object-cover" />
                                       ) : (
                                           <User size={20} className="text-green-500" />
                                       )}
                                   </div>
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-start mb-1">
                                       <h5 className="font-bold text-gray-800 text-sm truncate pr-2">{f.nama_user}</h5>
                                       <span className="text-[10px] text-gray-400 whitespace-nowrap">{f.tanggal}</span>
                                   </div>
                                   <div className="flex items-center gap-0.5 mb-2">
                                       {renderStars(f.rating)}
                                   </div>
                                   <p className="text-gray-600 text-sm leading-relaxed">
                                       {f.komentar || <span className="italic text-gray-400">Tidak ada teks ulasan</span>}
                                   </p>
                               </div>
                           </div>
                       )) : (
                           <p className="text-center text-gray-500 text-sm py-4">Belum ada rincian ulasan.</p>
                       )}
                   </div>
                </div>

             </div>
          ) : (
             <div className="text-center text-gray-500 py-10">Data tidak tersedia</div>
          )}
        </div>

      </div>
    </div>
  );
}