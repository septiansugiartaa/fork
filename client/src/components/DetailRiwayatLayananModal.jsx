import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

export default function DetailRiwayatLayananModal({ isOpen, onClose, idRiwayat }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && idRiwayat) {
        fetchDetail();
    }
  }, [isOpen, idRiwayat]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3000/api/santri/layanan/riwayat/${idRiwayat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetail(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Helper status color
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('selesai') || s.includes('diterima')) return { color: 'text-green-600 bg-green-50', icon: CheckCircle };
    if (s.includes('batal') || s.includes('tolak')) return { color: 'text-red-600 bg-red-50', icon: XCircle };
    return { color: 'text-yellow-600 bg-yellow-50', icon: Clock };
  };

  const statusConfig = detail ? getStatusConfig(detail.status_sesudah || detail.status_sebelum) : {};
  const StatusIcon = statusConfig.icon || Clock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl">
            <h3 className="font-bold text-gray-800 text-lg">Rincian Pengajuan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-600" /></div>
            ) : detail ? (
                <>
                    {/* Header Info */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-3 text-green-600">
                            <FileText size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{detail.jenis_layanan?.nama_layanan}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Diajukan pada: {new Date(detail.waktu).toLocaleDateString('id-ID', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${statusConfig.color} border-transparent bg-opacity-50`}>
                        <StatusIcon size={20} />
                        <span className="font-semibold capitalize">{detail.status_sesudah || detail.status_sebelum || 'Proses'}</span>
                    </div>

                    {/* Dynamic Details (Pertanyaan & Jawaban) */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 border-b pb-2">Data Formulir</h4>
                        {detail.riwayat_layanan_detail && detail.riwayat_layanan_detail.length > 0 ? (
                            detail.riwayat_layanan_detail.map((item) => (
                                <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">{item.aspek}</p>
                                    <p className="text-gray-800 text-sm font-medium">{item.detail}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm italic">Tidak ada detail tambahan.</p>
                        )}
                    </div>

                    {/* Catatan Petugas (Jika ada) */}
                    {detail.catatan && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <p className="text-xs text-green-600 font-bold mb-1">Catatan Sistem/Petugas:</p>
                            <p className="text-sm text-green-800">{detail.catatan}</p>
                        </div>
                    )}
                </>
            ) : (
                <p className="text-center text-red-500">Data tidak ditemukan.</p>
            )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
                Tutup
            </button>
        </div>

      </div>
    </div>
  );
}