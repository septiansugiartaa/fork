import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X, FileText, CheckCircle, Clock, Loader2, Download } from 'lucide-react';
import { PdfRiwayatLayanan } from './PdfRiwayatLayanan';
import AlertToast from './AlertToast';
import { useAlert } from '../hooks/useAlert';

export default function DetailRiwayatLayananModal({ isOpen, onClose, idRiwayat }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && idRiwayat) fetchDetail();
  }, [isOpen, idRiwayat]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/santri/layanan/riwayat/${idRiwayat}`);
      setDetail(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!detail) return;
    setGeneratingPdf(true);
    try {
      await PdfRiwayatLayanan(detail, currentUser.nama || '-');
    } catch (err) {
      showAlert('error', 'Gagal membuat PDF. Coba lagi.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><FileText size={20} className="text-green-600" /> Detail Permintaan</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-green-600" size={32} /></div>
          ) : detail ? (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{detail.jenis_layanan.nama_layanan}</h4>
                    <p className="text-sm text-gray-500">{new Date(detail.waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${detail.status_sesudah === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {detail.status_sesudah || "Diproses"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {detail.riwayat_layanan_detail?.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{item.aspek}</p>
                    <p className="text-sm text-gray-800 font-medium">{item.detail}</p>
                  </div>
                ))}
              </div>

              {detail.catatan && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-xs text-green-600 font-bold mb-1 flex items-center gap-1"><CheckCircle size={14} /> Catatan Petugas:</p>
                  <p className="text-sm text-green-800 italic">{detail.catatan}</p>
                </div>
              )}
            </>
          ) : <p className="text-center text-gray-400 py-10">Data tidak ditemukan</p>}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">Tutup</button>
          {detail && (
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {generatingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {generatingPdf ? 'Membuat PDF...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
