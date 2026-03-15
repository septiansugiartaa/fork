import { useState, useEffect } from "react";
import api from "../../config/api";
import { X, Check, XCircle, ExternalLink, Loader2 } from "lucide-react";

export default function PendaftarDetailModal({ isOpen, data, onClose, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk menggantikan fungsi prompt()
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (isOpen && data) {
        setLoading(true);
        api.get(`/ppdb/admin/pendaftar/${data.id}`)
        .then((r) => setDetail(r.data.data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, data]);

  const handleVerifDokumen = async (idDokumen, status) => {
    try {
      await api.patch(`/ppdb/admin/dokumen/${idDokumen}/verifikasi`, { status_verif: status, catatan: rejectNote });
      setRejectingDocId(null); setRejectNote("");
      // Refresh local detail data
      const res = await api.get(`/ppdb/admin/pendaftar/${data.id}`);
      setDetail(res.data.data);
      onRefresh(); // Refresh parent table
    } catch (err) {
      alert("Gagal update dokumen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Detail Pendaftar</h3>
            {detail && <p className="text-xs font-bold font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block mt-1">{detail.no_pendaftaran}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X size={20}/></button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center"><Loader2 className="animate-spin text-green-500 mb-3" size={32}/> Memuat data...</div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            <section>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 bg-gray-50 px-3 py-1.5 rounded-md inline-block">Data Diri</p>
              <div className="grid grid-cols-2 gap-y-4 px-2 text-sm">
                <div><p className="text-gray-400 text-xs font-bold mb-1">Nama Lengkap</p><p className="text-gray-800 font-bold">{detail.nama_lengkap}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">L/P</p><p className="text-gray-800 font-medium">{detail.jenis_kelamin}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">Tempat, Tgl Lahir</p><p className="text-gray-800 font-medium">{detail.tempat_lahir}, {new Date(detail.tanggal_lahir).toLocaleDateString("id-ID")}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">Kontak (HP / WA)</p><p className="text-gray-800 font-medium">{detail.no_hp || "-"}</p></div>
                <div className="col-span-2"><p className="text-gray-400 text-xs font-bold mb-1">Alamat Lengkap</p><p className="text-gray-800 font-medium">{detail.alamat}</p></div>
              </div>
            </section>

            <section className="border-t border-gray-100 pt-5">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 bg-gray-50 px-3 py-1.5 rounded-md inline-block">Pendidikan & Quran</p>
              <div className="grid grid-cols-2 gap-y-4 px-2 text-sm">
                <div><p className="text-gray-400 text-xs font-bold mb-1">Asal Sekolah</p><p className="text-gray-800 font-medium">{detail.asal_sekolah || "-"}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">Nilai Rata-rata</p><p className="text-gray-800 font-medium">{detail.nilai_rata_rapor || "-"}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">Kemampuan Quran</p><p className="text-gray-800 font-medium">{detail.kemampuan_quran?.replace(/_/g, " ") || "-"}</p></div>
                <div><p className="text-gray-400 text-xs font-bold mb-1">Hafalan</p><p className="text-gray-800 font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block">{detail.juz_hafalan || 0} Juz</p></div>
              </div>
            </section>

            {detail.ppdb_dokumen?.length > 0 && (
              <section className="border-t border-gray-100 pt-5">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 bg-gray-50 px-3 py-1.5 rounded-md inline-block">Berkas Dokumen</p>
                <div className="space-y-3">
                  {detail.ppdb_dokumen.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-800">{doc.jenis_dokumen.replace(/_/g, " ")}</p>
                                {doc.catatan && <p className="text-xs font-bold text-red-500 mt-1 italic">Ditolak: {doc.catatan}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${doc.status_verif === "Terverifikasi" ? "bg-green-100 text-green-700" : doc.status_verif === "Ditolak" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                {doc.status_verif.replace(/_/g, " ")}
                                </span>
                                <a href={`${api.defaults.baseURL.replace('/api', '')}/uploads/ppdb/dokumen/${doc.path_file}`} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"><ExternalLink size={16} /></a>
                                {doc.status_verif !== "Terverifikasi" && <button onClick={() => handleVerifDokumen(doc.id, "Terverifikasi")} className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"><Check size={16} /></button>}
                                {doc.status_verif !== "Ditolak" && <button onClick={() => setRejectingDocId(doc.id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"><XCircle size={16} /></button>}
                            </div>
                        </div>
                        {/* Inline form to reject document gracefully */}
                        {rejectingDocId === doc.id && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                                <input type="text" placeholder="Masukkan alasan penolakan..." value={rejectNote} onChange={(e)=>setRejectNote(e.target.value)} className="flex-1 px-3 py-1.5 text-xs rounded-md border border-red-200 outline-none focus:border-red-400" autoFocus/>
                                <button onClick={() => handleVerifDokumen(doc.id, "Ditolak")} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-md hover:bg-red-600 transition">Tolak File</button>
                                <button onClick={() => setRejectingDocId(null)} className="px-3 py-1.5 bg-white text-gray-500 border border-gray-200 text-xs font-bold rounded-md hover:bg-gray-100 transition">Batal</button>
                            </div>
                        )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}