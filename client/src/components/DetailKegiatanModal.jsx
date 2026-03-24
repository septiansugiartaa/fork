import React from "react";
import { X, Calendar, Clock, MapPin, MessageSquare, Star, Edit } from "lucide-react";

export default function DetailKegiatanModal({ isOpen, onClose, data, onFeedbackClick, role, onEditClick }) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-40 bg-green-50 w-full flex-shrink-0 flex items-center justify-center text-green-500 relative">
          <Calendar size={100} strokeWidth={2} />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-gray-700 p-2 rounded-full transition backdrop-blur-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto [scrollbar-width:none]">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{data.nama}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-green-600 font-medium mb-1 block">Tanggal Pelaksanaan</label>
                <p className="text-gray-700 font-medium flex items-center"><Calendar size={16} className="mr-2 text-gray-400" /> {data.tanggal}</p>
              </div>
              <div>
                <label className="text-sm text-green-600 font-medium mb-1 block">Waktu</label>
                <p className="text-gray-700 font-medium flex items-center"><Clock size={16} className="mr-2 text-gray-400" /> {data.waktu}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-green-600 font-medium mb-1 block">Lokasi</label>
              <p className="text-gray-700 font-medium flex items-center"><MapPin size={16} className="mr-2 text-gray-400" /> {data.lokasi}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Deskripsi Kegiatan</h3>
            <p className="text-gray-600 leading-relaxed text-sm text-justify">{data.deskripsi}</p>
          </div>

          {role === "ustadz" && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Tutup</button>
              <button onClick={() => onEditClick(data)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg">
                <Edit size={16} /> Edit Kegiatan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}