import React, { useState, useEffect } from "react";
import api from "../../config/api"; 
import { useSearchParams, Link } from "react-router-dom";
import { Search, ArrowLeft, Loader2, CheckCircle, Clock, XCircle, Award, FileText, HelpCircle, UploadCloud, Check, CalendarDays, Download } from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

// Import Helper Cetak PDF
import { cetakBuktiPendaftaran } from "../../components/ppdb/CetakBuktiPpdb";
import { cetakUndanganSeleksi, cetakBuktiKelulusan } from "../../components/ppdb/CetakDokumenStatus";
import LupaNomorModal from "../../components/ppdb/LupaNomorModal";

const STATUS_INFO = {
  Mendaftar: { color: "bg-blue-50 border-blue-200 text-blue-700", icon: <Clock size={24} />, desc: "Menunggu verifikasi dokumen." },
  Verifikasi: { color: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: <Search size={24} />, desc: "Sedang diverifikasi oleh panitia." },
  Seleksi: { color: "bg-purple-50 border-purple-200 text-purple-700", icon: <CalendarDays size={24} />, desc: "Berkas valid. Silakan ikuti tes seleksi." },
  Lulus: { color: "bg-green-50 border-green-200 text-green-700", icon: <Award size={24} />, desc: "Lulus seleksi. Silakan lakukan daftar ulang." },
  Diterima: { color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <CheckCircle size={24} />, desc: "Resmi menjadi santri Darun-Na'im YAPIA." },
  Ditolak: { color: "bg-red-50 border-red-200 text-red-700", icon: <XCircle size={24} />, desc: "Belum berhasil pada gelombang ini." },
};

const DOC_STATUS = {
  Belum_Diverifikasi: { label: "Pending", color: "text-yellow-700 bg-yellow-100" },
  Terverifikasi: { label: "Valid", color: "text-green-700 bg-green-100" },
  Ditolak: { label: "Ditolak", color: "text-red-700 bg-red-100" },
};

const EXPECTED_DOCS = [
  { key: "Foto_3x4", label: "Foto 3×4" }, 
  { key: "Akta_Kelahiran", label: "KK / Akta" }, 
  { key: "Ijazah", label: "Ijazah / SKL" }
];

export default function CekStatus() {
  const [searchParams] = useSearchParams();
  const [noPendaftaran, setNoPendaftaran] = useState(searchParams.get("no") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { message, showAlert, clearAlert } = useAlert();

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState({ daftar: false, undangan: false, lulus: false });
  const [uploadStatus, setUploadStatus] = useState({});

  const handleCek = async () => {
    if (!noPendaftaran.trim()) return;
    setLoading(true); setError(""); setData(null);
    try {
      const res = await api.get(`/ppdb/public/status/${noPendaftaran.trim()}`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Nomor tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("no")) handleCek();
  }, []);

  const handleDownloadDaftar = async () => {
    if (!data) return;
    setIsPdfLoading(prev => ({...prev, daftar: true}));
    try {
      await cetakBuktiPendaftaran({
        noPendaftaran: data.no_pendaftaran,
        namaLengkap: data.nama_lengkap,
        namaGelombang: data.ppdb_tahun?.nama_gelombang || "-",
        tahunAjaran: data.ppdb_tahun?.tahun_ajaran || "-"
      });
    } catch (err) { showAlert("error", "Gagal memuat dokumen PDF."); } 
    finally { setIsPdfLoading(prev => ({...prev, daftar: false})); }
  };

  const handleDownloadUndangan = async () => {
    if (!data) return;
    setIsPdfLoading(prev => ({...prev, undangan: true}));
    try {
      await cetakUndanganSeleksi({
        noPendaftaran: data.no_pendaftaran,
        namaLengkap: data.nama_lengkap,
        namaGelombang: data.ppdb_tahun?.nama_gelombang || "-",
        tahunAjaran: data.ppdb_tahun?.tahun_ajaran || "-",
        // Ambil tanggal dari batas tutup gelombang (sebagai contoh dinamis)
        tanggalSeleksi: data.ppdb_tahun?.tanggal_seleksi || null 
      });
    } catch (err) { showAlert("error", "Gagal memuat dokumen PDF."); } 
    finally { setIsPdfLoading(prev => ({...prev, undangan: false})); }
  };

  const handleDownloadKelulusan = async () => {
    if (!data || !data.ppdb_seleksi) return;
    setIsPdfLoading(prev => ({...prev, lulus: true}));
    // Karena di controller baru dibikin array, kita ambil object pertama
    const seleksiData = Array.isArray(data.ppdb_seleksi) ? data.ppdb_seleksi[0] : data.ppdb_seleksi;
    
    try {
      await cetakBuktiKelulusan({
        noPendaftaran: data.no_pendaftaran,
        namaLengkap: data.nama_lengkap,
        tahunAjaran: data.ppdb_tahun?.tahun_ajaran || "-",
        nilaiQuran: seleksiData.nilai_quran,
        nilaiTulis: seleksiData.nilai_tulis,
        nilaiWawancara: seleksiData.nilai_wawancara,
        nilaiTotal: seleksiData.nilai_total
      });
    } catch (err) { showAlert("error", "Gagal memuat dokumen PDF."); } 
    finally { setIsPdfLoading(prev => ({...prev, lulus: false})); }
  };

  const handleUploadSusulan = async (jenis, file) => {
    // ... (sama seperti kode Anda sebelumnya)
    if (!data?.no_pendaftaran) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jenis_dokumen", jenis);
    
    setUploadStatus((prev) => ({ ...prev, [jenis]: "uploading" }));
    try {
      await api.post(`/ppdb/public/dokumen/${data.no_pendaftaran}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus((prev) => ({ ...prev, [jenis]: "success" }));
      handleCek();
    } catch (err) {
      setUploadStatus((prev) => ({ ...prev, [jenis]: "error" }));
      showAlert("error", "Gagal mengunggah dokumen. Pastikan ukuran max 2MB.");
    }
  };

  const statusInfo = data ? STATUS_INFO[data.status] || STATUS_INFO.Mendaftar : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12">
              <img src="../../src/assets/logo.png" alt="PPDNY" />
            </div>
             <div>
               <h1 className="text-lg font-bold text-gray-800 leading-tight">Cek Status</h1>
               <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">PPDB SIM-TREN</p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="mb-6">
          <Link to="/ppdb/daftar" className="inline-flex items-center gap-3 group">
            <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm group-hover:border-green-200 group-hover:bg-green-50 group-hover:-translate-x-1 transition-all duration-300">
              <ArrowLeft size={16} className="text-gray-700 group-hover:text-green-600 transition-colors" />
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">
              Buat Pendaftaran Baru
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Lacak Pendaftaran</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={noPendaftaran}
              onChange={(e) => setNoPendaftaran(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCek()}
              placeholder="Contoh: PPDB-20252026-G1-0001"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 font-mono font-bold"
            />
            <button id="btn-cek" onClick={handleCek} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-md shadow-green-100 sm:w-28 flex justify-center">
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Cek Data"}
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            {error ? <p className="text-sm font-medium text-red-500">⚠️ {error}</p> : <div/>}
            <button onClick={() => setShowForgotModal(true)} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition ml-auto">
               <HelpCircle size={14}/> Lupa Nomor Pendaftaran?
            </button>
          </div>
        </div>

        {data && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-2xl border-2 p-5 ${statusInfo.color}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                      {statusInfo.icon}
                  </div>
                  <div>
                    <p className="font-black text-xl uppercase tracking-wider">{data.status.replace(/_/g, " ")}</p>
                    <p className="text-sm font-medium opacity-90 mt-0.5">{statusInfo.desc}</p>
                  </div>
                </div>
                
                {/* RENDER TOMBOL DINAMIS BERDASARKAN STATUS */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {/* Status Lulus / Diterima */}
                  {(data.status === "Lulus" || data.status === "Diterima") ? (
                    <button onClick={handleDownloadKelulusan} disabled={isPdfLoading.lulus} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white border border-transparent rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-lg shadow-green-100">
                      {isPdfLoading.lulus ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} 
                      Cetak Bukti Lulus
                    </button>
                  ) : null}

                  {/* Status Seleksi */}
                  {(data.status === "Seleksi") ? (
                    <button onClick={handleDownloadUndangan} disabled={isPdfLoading.undangan} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white border border-transparent rounded-xl font-bold text-sm hover:bg-purple-700 transition shadow-lg shadow-purple-100">
                      {isPdfLoading.undangan ? <Loader2 size={16} className="animate-spin"/> : <CalendarDays size={16}/>} 
                      Undangan Seleksi
                    </button>
                  ) : null}

                  {/* Selalu tampilkan Bukti Pendaftaran kecuali jika sudah lulus/ditolak untuk tidak membingungkan */}
                  {!(data.status === "Lulus" || data.status === "Diterima" || data.status === "Ditolak") && (
                    <button onClick={handleDownloadDaftar} disabled={isPdfLoading.daftar} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-current rounded-xl font-bold text-sm hover:bg-opacity-80 transition">
                      {isPdfLoading.daftar ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16}/>} 
                      Bukti Daftar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SISA KODE PROFIL & DOKUMEN SAMA SEPERTI SEBELUMNYA ... */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Profil Calon Santri</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nomor Registrasi</p><p className="font-bold font-mono text-green-700 bg-green-50 px-2 py-1 rounded inline-block">{data.no_pendaftaran}</p></div>
                <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Lengkap</p><p className="font-bold text-gray-800">{data.nama_lengkap}</p></div>
                <div className="col-span-2"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jalur Pendaftaran</p><p className="font-medium text-gray-700">{data.ppdb_tahun?.nama_gelombang} — {data.ppdb_tahun?.tahun_ajaran}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-1">Status Dokumen</h3>
              <p className="text-sm text-gray-500 mb-4 border-b border-gray-100 pb-3">Silakan lengkapi dokumen yang kurang atau perbaiki dokumen yang ditolak.</p>
              
              <div className="space-y-3">
                {EXPECTED_DOCS.map((doc) => {
                  const existingDoc = data.ppdb_dokumen?.find((d) => d.jenis_dokumen === doc.key);
                  const ds = existingDoc ? DOC_STATUS[existingDoc.status_verif] : null;

                  return (
                    <div key={doc.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 bg-gray-50/50 rounded-xl gap-3">
                      <div>
                        <p className="font-bold text-sm text-gray-700">{doc.label}</p>
                        {existingDoc?.catatan && <p className="text-[11px] text-red-500 italic mt-0.5">Catatan: {existingDoc.catatan}</p>}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {existingDoc && (
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${ds?.color}`}>
                            {ds?.label}
                          </span>
                        )}

                        {(!existingDoc || existingDoc.status_verif === "Ditolak") && (
                          uploadStatus[doc.key] === "uploading" ? (
                            <span className="text-gray-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Loader2 size={14} className="animate-spin"/> Uploading...</span>
                          ) : uploadStatus[doc.key] === "success" ? (
                            <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Check size={14}/> Berhasil</span>
                          ) : (
                            <label className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-2 shadow-sm">
                              <input 
                                type="file" 
                                accept=".jpg,.jpeg,.png,.pdf" 
                                className="hidden" 
                                onChange={(e) => e.target.files[0] && handleUploadSusulan(doc.key, e.target.files[0])} 
                              />
                              <UploadCloud size={14} className="text-gray-400"/> 
                              {existingDoc?.status_verif === "Ditolak" ? "Upload Ulang" : "Upload"}
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      <LupaNomorModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onUseNumber={(nomor) => {
          setNoPendaftaran(nomor);
          setTimeout(() => document.getElementById("btn-cek").click(), 100);
        }}
      />
    </div>
  );
}