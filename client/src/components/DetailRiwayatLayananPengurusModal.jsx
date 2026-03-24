import React from 'react';
import { X, FileText, Calendar, Star, MessageSquare, User, Edit } from 'lucide-react';

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
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div><h3 className="font-bold text-gray-800 text-lg">Detail Pengajuan Layanan</h3><p className="text-xs text-gray-500">Log Aktivitas Santri</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 [scrollbar-width:none]">
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600"><FileText size={24}/></div>
            <div><h4 className="font-bold text-gray-900">{data.jenis_layanan.nama_layanan}</h4><p className="text-xs text-green-700 flex items-center gap-1"><Calendar size={12}/> {formatDate(data.waktu)}</p></div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3"><User size={18} className="text-gray-400"/><div className="text-sm"><p className="text-xs text-gray-400">Identitas Pengaju</p><p className="font-bold text-gray-800">{data.users.nama} ({data.users.nip})</p></div></div>
            <div className="grid grid-cols-1 gap-3">
              {data.riwayat_layanan_detail?.map(d => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">{d.aspek}</p><p className="text-sm text-gray-700 font-medium">{d.detail}</p></div>
              ))}
            </div>
            {data.catatan && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100"><p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Catatan Sistem/Petugas</p><p className="text-sm text-blue-800 italic">{data.catatan}</p></div>
            )}
          </div>

          {feedback && (
            <div className="pt-4 border-t border-gray-100">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ulasan dari Santri</h5>
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />)}
                  <span className="text-[10px] text-gray-500 ml-2 mt-0.5">{new Date(feedback.tanggal).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex gap-2"><MessageSquare size={16} className="text-yellow-600 flex-shrink-0 mt-0.5"/><p className="text-sm text-gray-700 italic">"{feedback.isi_text || 'Tanpa komentar.'}"</p></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-bold">Tutup</button>
          {canProcess && <button onClick={() => onProcess(data)} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold flex items-center gap-2 shadow-lg shadow-green-100"><Edit size={16}/> Proses Layanan</button>}
        </div>
      </div>
    </div>
  );
}