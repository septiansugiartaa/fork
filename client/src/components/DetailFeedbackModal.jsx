import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X, Loader2, Star, MessageSquare, Trash2 } from 'lucide-react';

export default function DetailFeedbackModal({ isOpen, onClose, targetItem, role, onFeedbackHidden }) {
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
      const res = await api.get(`/${role}/feedback/detail/${targetItem.tipe}/${targetItem.id}`);
      if (res.data.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHideFeedback = async (idFeedback) => {
    if (!window.confirm("Yakin ingin menyembunyikan komentar ini?")) return;
    try {
      const res = await api.put(`/${role}/feedback/moderasi/${idFeedback}`, { is_active: false });
      if (res.data.success) {
        fetchDetail();
        if (onFeedbackHidden) onFeedbackHidden();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <MessageSquare size={20} className="text-green-600" /> Rincian Ulasan
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-500" size={32} /></div>
          ) : data ? (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase mb-1">Target {targetItem.tipe}</p>
                <h4 className="text-lg font-bold text-gray-800">{data.judul}</h4>
              </div>

              <div>
                <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" /> Seluruh Komentar ({data.feedbacks?.length || 0})
                </h5>
                <div className="space-y-4">
                  {data.feedbacks?.length > 0 ? data.feedbacks.map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <span className="text-xs font-bold">{f.users?.nama?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{f.users?.nama}</p>
                            <p className="text-[10px] text-gray-400">{new Date(f.tanggal).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < f.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                      <div className="pl-11">
                        {f.is_active ? (
                          <p className="text-sm text-gray-600 leading-relaxed italic">"{f.isi_text || 'Tidak ada komentar.'}"</p>
                        ) : (
                          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-50 p-2 rounded-lg">
                            <span>🚫</span>
                            <span className="italic">Komentar ini telah disembunyikan oleh Admin.</span>
                          </div>
                        )}
                      </div>
                      {role === 'admin' && f.is_active && (
                        <button onClick={() => handleHideFeedback(f.id)} className="absolute right-4 top-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                          <Trash2 size={16} />
                        </button>
                      )}
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