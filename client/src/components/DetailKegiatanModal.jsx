import { X, Calendar, Clock, MapPin, MessageSquare } from "lucide-react";

export default function DetailKegiatanModal({ isOpen, onClose, data, onFeedbackClick }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header (Gambar Placeholder Abu-abu seperti di desain) */}
        <div className="h-40 bg-blue-50 w-full flex-shrink-0 flex items-center justify-center text-blue-500 relative">
          <Calendar size={100} strokeWidth={2} />
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-gray-700 p-2 rounded-full transition backdrop-blur-sm"
            >
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Judul */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{data.nama}</h2>
          
          {/* Tombol Feedback (Kondisional) */}
          {data.can_feedback && (
            <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100 mb-6">
                <div>
                    <p className="text-blue-800 font-bold text-sm">Bagaimana kegiatan ini?</p>
                    <p className="text-blue-600 text-xs">Berikan masukan Anda untuk perbaikan ke depan.</p>
                </div>
                <button 
                    onClick={() => onFeedbackClick(data)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center shadow-sm"
                >
                    <MessageSquare size={16} className="mr-2" /> Berikan Feedback
                </button>
            </div>
          )}
          
          {/* Info jika sudah feedback */}
          {data.feedback_status === "Sudah Memberi Feedback" && (
             <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm font-medium mb-6">
                 Anda sudah memberikan feedback untuk kegiatan ini. Terima kasih!
             </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b border-gray-100 pb-8">
            <div>
                <label className="text-sm text-blue-600 font-medium mb-1 block">Tanggal</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" /> {data.tanggal}
                </p>
            </div>
            <div>
                <label className="text-sm text-blue-600 font-medium mb-1 block">Waktu</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <Clock size={16} className="mr-2 text-gray-400" /> {data.waktu}
                </p>
            </div>
            <div>
                <label className="text-sm text-blue-600 font-medium mb-1 block">Lokasi</label>
                <p className="text-gray-700 font-medium flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" /> {data.lokasi}
                </p>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Deskripsi Kegiatan</h3>
            <p className="text-gray-600 leading-relaxed text-sm text-justify">
                {data.deskripsi}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}