import { X, Calendar, Clock, MapPin, MessageSquare, Star, Edit } from "lucide-react";

export default function DetailKegiatanModal({ isOpen, onClose, data, onFeedbackClick, role, onEditClick }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="h-40 bg-green-50 w-full flex-shrink-0 flex items-center justify-center text-green-500 relative">
          <Calendar size={100} strokeWidth={2} />
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-gray-700 p-2 rounded-full transition backdrop-blur-sm"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto [scrollbar-width:none]">
          {/* Judul */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{data.nama}</h2>
                    
          {/* Skenario 1: Santri belum feedback (Disembunyikan jika role = ustadz) */}
          {role !== "ustadz" && onFeedbackClick && data.can_feedback && (
            <div className="bg-green-50 p-4 rounded-xl flex items-center justify-between border border-green-100 mb-6">
                <div>
                    <p className="text-green-800 font-bold text-sm">Bagaimana kegiatan ini?</p>
                    <p className="text-green-600 text-xs">Berikan masukan Anda untuk perbaikan ke depan.</p>
                </div>
                <button 
                    onClick={() => onFeedbackClick(data)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center shadow-sm">
                    <MessageSquare size={16} className="mr-2" /> Berikan Feedback
                </button>
            </div>
          )}

          {/* Skenario 2: Data Feedback Sudah Ada */}
          {role !== "ustadz" && data.feedback_data && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Penilaian Santri</p>
                    <p className="text-[10px] text-gray-400">{data.feedback_data.tanggal}</p>
                </div>
                <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} className={star <= data.feedback_data.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                    ))}
                    <span className="text-xs font-bold text-yellow-600 ml-2">{data.feedback_data.rating}/5</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{data.feedback_data.isi_text}"</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 pb-8">
            <div>
                <label className="text-sm text-green-600 font-medium mb-1 block">Tanggal</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" /> {data.tanggal}
                </p>
            </div>
            <div>
                <label className="text-sm text-green-600 font-medium mb-1 block">Waktu</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" /> {data.waktu}
                </p>
            </div>
            <div>
                <label className="text-sm text-green-600 font-medium mb-1 block">Lokasi</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" /> {data.lokasi}
                </p>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 overflow-y-auto">Deskripsi Kegiatan</h3>
            <p className="text-gray-600 leading-relaxed text-sm text-justify">
                {data.deskripsi}
            </p>
          </div>

          {/* Skenario Khusus Ustadz: Tombol Edit & Action Bar Bawah */}
          {role === "ustadz" && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                  Tutup
              </button>
              <button 
                  onClick={() => onEditClick(data)}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm"
              >
                  <Edit size={18} className="mr-2" /> Edit Kegiatan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}