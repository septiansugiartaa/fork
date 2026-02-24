import React from 'react';
import { X, FileText, CheckCircle, Clock, Star, MessageSquare, User, Edit } from 'lucide-react';

export default function DetailRiwayatModal({ isOpen, onClose, data, onProcess }) {
  if (!isOpen || !data) return null;

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const feedback = data.feedback && data.feedback.length > 0 ? data.feedback[0] : null;
  
  const canProcess = !data.status_sesudah || (data.status_sesudah !== 'Selesai' && data.status_sesudah !== 'Batal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Detail Pengajuan</h3>
            <p className="text-xs text-gray-500">ID: #{data.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
            <div className={`p-4 rounded-xl flex items-center gap-3 ${data.status_sesudah === 'Selesai' ? 'bg-green-50 text-green-800' : 'bg-green-50 text-green-800'}`}>
                {data.status_sesudah === 'Selesai' ? <CheckCircle size={24}/> : <Clock size={24}/>}
                <div>
                    <p className="text-xs opacity-70">Status Terkini</p>
                    <p className="font-bold uppercase">{data.status_sesudah || "Menunggu Proses"}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-500 mb-1">Nama Santri</p>
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-green-500"/>
                        <span className="font-semibold text-gray-800">{data.users?.nama}</span>
                    </div>
                </div>
                <div>
                    <p className="text-gray-500 mb-1">Jenis Layanan</p>
                    <p className="font-semibold text-gray-800">{data.jenis_layanan?.nama_layanan}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-gray-500 mb-1">Waktu Pengajuan</p>
                    <p className="font-semibold text-gray-800">{formatDate(data.waktu)}</p>
                </div>
            </div>

            <div className="border-t border-gray-100"></div>

            <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-green-600"/> Rincian Data
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    {data.riwayat_layanan_detail && data.riwayat_layanan_detail.length > 0 ? (
                        data.riwayat_layanan_detail.map((detail, index) => (
                            <div key={index}>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{detail.aspek}</p>
                                <p className="text-sm text-gray-800 mt-0.5 font-medium">{detail.detail}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">Tidak ada rincian tambahan.</p>
                    )}
                </div>
            </div>

            {data.catatan && (
                <>
                    <div className="border-t border-gray-100"></div>
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2">Catatan Pengurus</h4>
                        <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg border border-gray-200">
                            {data.catatan}
                        </p>
                    </div>
                </>
            )}

            {feedback && (
                <>
                    <div className="border-t border-gray-100"></div>
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Star size={18} className="text-yellow-500 fill-yellow-500"/> Ulasan Santri
                        </h4>
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={16} className={star <= feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
                                ))}
                                <span className="text-xs text-gray-500 ml-2 mt-0.5">({formatDate(feedback.tanggal)})</span>
                            </div>
                            <div className="flex gap-2">
                                <MessageSquare size={16} className="text-yellow-600 flex-shrink-0 mt-0.5"/>
                                <p className="text-sm text-gray-700 italic">"{feedback.isi_text || 'Tidak ada komentar.'}"</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium">
                Tutup
            </button>
            
            {/* Tombol Proses */}
            {canProcess && (
                <button 
                    onClick={() => onProcess(data)}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium flex items-center gap-2 shadow-lg"
                >
                    <Edit size={16} /> Tindak Lanjut
                </button>
            )}
        </div>
      </div>
    </div>
  );
}