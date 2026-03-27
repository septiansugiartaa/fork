import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X, Eye, Loader2, CheckCircle } from 'lucide-react';
import DetailPembayaranModal from './DetailPembayaranModal';
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function ListPembayaranModal({ isOpen, onClose, idTagihan, userRole }) {
  const [list, setList] = useState([]);
  const [tagihanInfo, setTagihanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { message, showAlert, clearAlert } = useAlert();
  const [detailData, setDetailData] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isReadOnly = !["pengurus", "admin"].includes(userRole?.toLowerCase());

  useEffect(() => {
    if (isOpen && idTagihan) fetchPembayaran();
  }, [isOpen, idTagihan]);

  const fetchPembayaran = async () => {
    setLoading(true);
    try {
        const res = await api.get(`/pengurus/keuangan/pembayaran/${idTagihan}`);
        setList(res.data.data);
        setTagihanInfo(res.data.tagihanInfo);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUpdateStatusTagihan = async (e) => {
      if(isReadOnly) return; 
      const newStatus = e.target.value;
      if(!window.confirm(`Ubah status tagihan menjadi ${newStatus}?`)) return;
      try {
          await api.put(`/pengurus/keuangan/tagihan/${idTagihan}/status`, { status: newStatus });
          setTagihanInfo(prev => ({ ...prev, status: newStatus }));
          showAlert("success", "Status berhasil diperbarui");
      } catch (err) { showAlert("error", "Gagal update status"); }
  };

  const openDetail = (item) => { setDetailData(item); setIsDetailOpen(true); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <div><h3 className="font-bold text-gray-800 text-lg">Riwayat Pembayaran</h3>{tagihanInfo && <div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-500">Status:</span>{isReadOnly ? <span className={`text-xs font-bold px-2 py-1 rounded ${tagihanInfo.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tagihanInfo.status}</span> : <select value={tagihanInfo.status || 'Aktif'} onChange={handleUpdateStatusTagihan} className={`text-xs font-bold px-2 py-1 rounded outline-none ${tagihanInfo.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}><option value="Aktif">Aktif</option><option value="Lunas">Lunas</option></select>}</div>}</div>
            <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
            {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-500"/></div> : (
                <table className="w-full text-left text-sm">
                    <thead><tr className="bg-gray-50 text-gray-600"><th className="p-3">Tanggal</th><th className="p-3">Nominal</th><th className="p-3">Metode</th><th className="p-3">Status</th><th className="p-3 text-center">Aksi</th></tr></thead>
                    <tbody className="divide-y">{list.length > 0 ? list.map(item => (<tr key={item.id}><td className="p-3">{new Date(item.tanggal_bayar).toLocaleDateString('id-ID')}</td><td className="p-3 font-semibold">Rp {item.nominal.toLocaleString('id-ID')}</td><td className="p-3">{item.metode_bayar}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Berhasil' ? 'bg-green-100 text-green-700' : item.status === 'Gagal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span></td><td className="p-3 text-center"><button onClick={() => openDetail(item)} className="text-green-600 p-1.5"><Eye size={16}/></button></td></tr>)) : <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada pembayaran.</td></tr>}</tbody>
                </table>
            )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl"><button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-xl">Tutup</button></div>
      </div>
      <DetailPembayaranModal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); fetchPembayaran(); }} data={detailData} userRole={userRole} />
    </div>
  );
}