import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DetailPembayaranModal({ isOpen, onClose, data }) {
  const [statusVerifikasi, setStatusVerifikasi] = useState("");
  const [nominalKonfirmasi, setNominalKonfirmasi] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
        setStatusVerifikasi(data.status); // Set status awal (Pending/Berhasil/Gagal)
        setNominalKonfirmasi(data.nominal); // Set nominal awal
    }
  }, [isOpen, data]);

  const formatDate = (dateString) => {
    if(!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (!isOpen || !data) return null;

  const handleSave = async () => {
      setSaving(true);
      try {
          const token = localStorage.getItem("token");
          await axios.put(`http://localhost:3000/api/pengurus/keuangan/pembayaran/${data.id}/verify`, {
              status: statusVerifikasi,
              nominal_baru: parseFloat(nominalKonfirmasi) // Kirim nominal yang dikonfirmasi
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          alert("Verifikasi berhasil disimpan");
          onClose(); // Tutup modal
      } catch (err) {
          console.error(err);
          alert("Gagal menyimpan verifikasi");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Detail Pembayaran</h3>
            <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
            {/* Info Utama */}
            <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Dibayarkan (Input Santri)</p>
                <h2 className="text-3xl font-bold text-blue-600">Rp {data.nominal.toLocaleString('id-ID')}</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm border border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Tanggal</span> <span className="font-medium">{formatDate(data.tanggal_bayar)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Metode</span> <span className="font-medium">{data.metode_bayar}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ID Transaksi</span> <span className="font-medium">#{data.id}</span></div>
            </div>

            {/* Bukti Pembayaran */}
            {data.bukti_bayar ? (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran</p>
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <a href={`http://localhost:3000/uploads/${data.bukti_bayar}`} target="_blank" rel="noreferrer">
                            <img src={`http://localhost:3000/uploads/${data.bukti_bayar}`} alt="Bukti" className="w-full h-auto object-contain max-h-48"/>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400 text-sm italic p-2 bg-gray-50 rounded-lg">Tidak ada bukti foto</div>
            )}

            <div className="border-t border-gray-100 pt-2"></div>

            {/* --- SECTION VERIFIKASI --- */}
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Verifikasi Admin</label>
                
                {/* Toggle Button Group */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button 
                        type="button"
                        onClick={() => setStatusVerifikasi('Berhasil')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition border ${statusVerifikasi === 'Berhasil' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <CheckCircle size={16}/> Valid
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStatusVerifikasi('Gagal')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition border ${statusVerifikasi === 'Gagal' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <XCircle size={16}/> Tidak Valid
                    </button>
                </div>

                {/* Input Konfirmasi Nominal (Hanya jika Valid) */}
                {statusVerifikasi === 'Berhasil' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Konfirmasi Nominal Masuk (Rp)</label>
                        <input 
                            type="number" 
                            className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-800"
                            value={nominalKonfirmasi}
                            onChange={(e) => setNominalKonfirmasi(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">*Ubah jika nominal di bukti berbeda dengan input santri.</p>
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center disabled:opacity-70"
            >
                {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                Simpan Verifikasi
            </button>

        </div>
      </div>
    </div>
  );
}