import React from 'react';
import { X, Clock, FileText } from 'lucide-react';

const DetailLayananModal = ({ isOpen, onClose, layanan, onAjukan }) => {
  if (!isOpen || !layanan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{layanan.nama_layanan}</h2>
            <p className="text-sm text-gray-500 mt-1">Rincian persyaratan layanan</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <FileText size={24} />
             </div>
             <div>
                <h4 className="font-semibold text-gray-700 text-sm">Deskripsi</h4>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {layanan.deskripsi || "Tidak ada deskripsi tersedia."}
                </p>
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Clock size={24} />
             </div>
             <div>
                <h4 className="font-semibold text-gray-700 text-sm">Estimasi Pengerjaan</h4>
                <p className="text-gray-600 text-sm mt-1">
                    {layanan.estimasi || "Menyesuaikan kondisi"} hari
                </p>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition"
          >
            Tutup
          </button>
          <button 
            onClick={() => onAjukan(layanan)}
            className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg hover:shadow-green-500/30 transition"
          >
            Ajukan Layanan
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetailLayananModal;