import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import DetailPembayaranModal from './DetailPembayaranModal';

export default function ListPembayaranModal({ isOpen, onClose, idTagihan }) {
  const [list, setList] = useState([]);
  const [tagihanInfo, setTagihanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Detail Modal State
  const [detailData, setDetailData] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  useEffect(() => {
    if (isOpen && idTagihan) {
        fetchPembayaran();
    }
  }, [isOpen, idTagihan]);

  const fetchPembayaran = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:3000/api/pengurus/keuangan/pembayaran/${idTagihan}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setList(res.data.data);
        setTagihanInfo(res.data.tagihanInfo); // Simpan info tagihan
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Handler Update Status Tagihan
  const handleUpdateStatusTagihan = async (e) => {
      const newStatus = e.target.value;
      if(!window.confirm(`Ubah status tagihan menjadi ${newStatus}?`)) return;

      try {
          const token = localStorage.getItem("token");
          await axios.put(`http://localhost:3000/api/pengurus/keuangan/tagihan/${idTagihan}/status`, {
              status: newStatus
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setTagihanInfo(prev => ({ ...prev, status: newStatus }));
      } catch (err) {
          showAlert("error", "Gagal update status");
      }
  };

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const openDetail = (item) => {
      setDetailData(item);
      setIsDetailOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Alert */}
        {message.text && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
            {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} <p className="text-sm font-medium">{message.text}</p>
            </div>
        )}
        
        {/* Header Updated: Ada Toggle Status Tagihan */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <div>
                <h3 className="font-bold text-gray-800 text-lg">Riwayat Pembayaran</h3>
                {tagihanInfo && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Status Tagihan:</span>
                        <select 
                            value={tagihanInfo.status || 'Aktif'}
                            onChange={handleUpdateStatusTagihan}
                            className={`text-xs font-bold px-2 py-1 rounded border-none outline-none cursor-pointer ${tagihanInfo.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            <option value="Aktif">Aktif (Belum Lunas)</option>
                            <option value="Lunas">Lunas</option>
                        </select>
                    </div>
                )}
            </div>
            <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
            {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-green-500"/></div> : (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600"><th className="p-3">Tanggal</th><th className="p-3">Nominal</th><th className="p-3">Metode</th><th className="p-3">Status</th><th className="p-3 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y">
                        {list.length > 0 ? list.map(item => (
                            <tr key={item.id}>
                                <td className="p-3">{formatDate(item.tanggal_bayar)}</td>
                                <td className="p-3 font-semibold">Rp {item.nominal.toLocaleString('id-ID')}</td>
                                <td className="p-3">{item.metode_bayar}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Berhasil' ? 'bg-green-100 text-green-700' : item.status === 'Gagal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => openDetail(item)} className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg transition"><Eye size={16}/></button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada pembayaran.</td></tr>}
                    </tbody>
                </table>
            )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end"><button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-100">Tutup</button></div>
      </div>

      <DetailPembayaranModal 
        isOpen={isDetailOpen} 
        onClose={() => { setIsDetailOpen(false); fetchPembayaran(); }} // Refresh list setelah tutup detail (siapa tau ada update)
        data={detailData} 
      />
    </div>
  );
}