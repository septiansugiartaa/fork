import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

// TAMBAHKAN PROP userRole DI SINI
export default function DetailPembayaranModal({ isOpen, onClose, data, userRole }) {
  const [statusVerifikasi, setStatusVerifikasi] = useState("");
  const [nominalKonfirmasi, setNominalKonfirmasi] = useState("");
  const [saving, setSaving] = useState(false);

  // LOGIKA PENGECEKAN ROLE
  // Hanya pengurus dan admin yang bukan read-only
  const isReadOnly = !["pengurus", "admin"].includes(userRole?.toLowerCase());

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
      // Proteksi backend: Cegah fungsi berjalan jika Read Only
      if (isReadOnly) return;

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
        
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="font-bold text-gray-800">Detail Pembayaran</h3>
            <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500 transition"/></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
            {/* Info Utama */}
            <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Dibayarkan</p>
                <h2 className="text-3xl font-bold text-green-600">Rp {data.nominal.toLocaleString('id-ID')}</h2>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm border border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Tanggal</span> <span className="font-medium">{formatDate(data.tanggal_bayar)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Metode</span> <span className="font-medium">{data.metode_bayar}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ID Transaksi</span> <span className="font-medium">#{data.id}</span></div>
                
                {/* Tampilkan Status Pembayaran Saat Ini (Opsional: Berguna untuk Pimpinan) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Status Sistem</span> 
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.status === 'Berhasil' ? 'bg-green-100 text-green-700' : data.status === 'Gagal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {data.status}
                    </span>
                </div>
            </div>

            {/* Bukti Pembayaran */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bukti Pembayaran</p>
                {data.bukti_bayar ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <a href={`http://localhost:3000/uploads/${data.bukti_bayar}`} target="_blank" rel="noreferrer">
                            <img src={`http://localhost:3000/uploads/${data.bukti_bayar}`} alt="Bukti" className="w-full h-auto object-contain max-h-48"/>
                        </a>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 text-sm italic p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Tidak ada file bukti transfer
                    </div>
                )}
            </div>

            {/* VERIFIKASI PENGURUS */}
            {!isReadOnly && (
                <>
                    <div className="border-t border-gray-100 pt-2"></div>

                    {/* --- SECTION VERIFIKASI --- */}
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Verifikasi Pengurus</label>
                        
                        {/* Toggle Button Group */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button 
                                type="button"
                                onClick={() => setStatusVerifikasi('Berhasil')}
                                className={`py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition border ${statusVerifikasi === 'Berhasil' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <CheckCircle size={16}/> Valid
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStatusVerifikasi('Gagal')}
                                className={`py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition border ${statusVerifikasi === 'Gagal' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <XCircle size={16}/> Tidak Valid
                            </button>
                        </div>

                        {/* Input Konfirmasi Nominal (Hanya jika Valid) */}
                        {statusVerifikasi === 'Berhasil' && (
                            <div className="animate-in fade-in slide-in-from-top-2 bg-green-50/50 p-3 rounded-xl border border-green-100">
                                <label className="block text-xs font-medium text-green-800 mb-1.5">Konfirmasi Nominal Masuk (Rp)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2.5 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-semibold text-gray-800 bg-white"
                                    value={nominalKonfirmasi}
                                    onChange={(e) => setNominalKonfirmasi(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">*Ubah angka di atas jika nominal transfer dibukti tidak sama dengan inputan aplikasi.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="w-full py-3 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                        {saving ? "Menyimpan..." : "Simpan Verifikasi"}
                    </button>
                </>
            )}

            {/* Tombol Tutup Khusus Pimpinan */}
            {isReadOnly && (
                <button 
                    onClick={onClose} 
                    className="w-full py-2.5 mt-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition"
                >
                    Kembali
                </button>
            )}

        </div>
      </div>
    </div>
  );
}