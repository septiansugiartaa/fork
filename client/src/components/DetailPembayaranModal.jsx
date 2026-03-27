import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function DetailPembayaranModal({ isOpen, onClose, data, userRole }) {
  const [statusVerifikasi, setStatusVerifikasi] = useState("");
  const [nominalKonfirmasi, setNominalKonfirmasi] = useState("");
  const [saving, setSaving] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();

  const isReadOnly = !["pengurus", "admin"].includes(userRole?.toLowerCase());

  useEffect(() => {
    if (isOpen && data) {
      setStatusVerifikasi(data.status);
      setNominalKonfirmasi(data.nominal);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      await api.put(`/pengurus/keuangan/pembayaran/${data.id}/verifikasi`, {
        status: statusVerifikasi,
        nominal: nominalKonfirmasi
      });
      onClose();
    } catch (err) {
      showAlert("error", "Gagal memverifikasi pembayaran");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Detail Verifikasi Bayar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner relative group">
            {data.bukti_bayar ? (
              <img 
                src={`/payments/${data.bukti_bayar}`} 
                alt="Bukti" 
                className="w-full h-full object-contain cursor-zoom-in" 
                onClick={() => window.open(`/payments/${data.bukti_bayar}`, '_blank')}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Tidak ada bukti gambar</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-b border-gray-100 pb-4">
            <div><p className="text-gray-400 mb-1">Metode</p><p className="font-bold text-gray-700">{data.metode_bayar}</p></div>
            <div className="text-right"><p className="text-gray-400 mb-1">Status Saat Ini</p><p className="font-bold text-blue-600">{data.status}</p></div>
          </div>

          {!isReadOnly ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Konfirmasi Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStatusVerifikasi('Berhasil')} className={`py-2 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${statusVerifikasi === 'Berhasil' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-100 text-gray-400'}`}><CheckCircle size={18} /> Berhasil</button>
                <button onClick={() => setStatusVerifikasi('Gagal')} className={`py-2 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-bold ${statusVerifikasi === 'Gagal' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-100 text-gray-400'}`}><XCircle size={18} /> Gagal</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nominal Diterima (Rp)</label>
                <input type="number" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-700" value={nominalKonfirmasi} onChange={(e) => setNominalKonfirmasi(e.target.value)} />
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg transition flex items-center justify-center disabled:opacity-70">
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />} Simpan Verifikasi
              </button>
            </div>
          ) : (
            <button onClick={onClose} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold transition">Tutup</button>
          )}
        </div>
      </div>
    </div>
  );
}