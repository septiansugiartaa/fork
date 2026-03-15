import React, { useState, useEffect, useCallback, useContext } from "react";
import api from "../../config/api";
import PendaftarDetailModal from "../../components/ppdb/PendaftarDetailModal";
import PendaftarManualModal from "../../components/ppdb/PendaftarManualModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";
import { AuthContext } from "../../context/AuthContext";
import {
  Search, Filter, Plus, Eye, UserCheck,
  Edit2, AlertTriangle, CheckCircle, X, Loader2
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "Mendaftar", label: "Mendaftar" },
  { value: "Verifikasi", label: "Verifikasi" },
  { value: "Seleksi", label: "Seleksi" },
  { value: "Lulus", label: "Lulus Seleksi" },
  { value: "Diterima", label: "Diterima" },
  { value: "Ditolak", label: "Ditolak" },
  { value: "Mengundurkan_Diri", label: "Mengundurkan Diri" },
];

const STATUS_BADGE = {
  Mendaftar: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  Verifikasi: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  Seleksi: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  Lulus: "bg-green-100 text-green-700 hover:bg-green-200",
  Diterima: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  Ditolak: "bg-red-100 text-red-700 hover:bg-red-200",
  Mengundurkan_Diri: "bg-gray-100 text-gray-500 hover:bg-gray-200",
};

export default function AdminPendaftar() {
  const { user } = useContext(AuthContext);
  const isPimpinan = user?.role?.toLowerCase() === "pimpinan";

  const [pendaftar, setPendaftar] = useState([]);
  const [tahunList, setTahunList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, id: null, currentStatus: "", nama: "" });

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(pendaftar, 15);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, nama: "", type: "" }); 
  const [catatan, setCatatan] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchPendaftar = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTahun) params.append("id_tahun", filterTahun);
      if (filterStatus) params.append("status", filterStatus);
      if (search) params.append("search", search);
      const res = await api.get(`/ppdb/admin/pendaftar?${params}`);
      setPendaftar(res.data.data);
      jump(1);
    } catch (err) {
      showAlert("error", "Gagal memuat data pendaftar");
    } finally {
      setLoading(false);
    }
  }, [filterTahun, filterStatus, search, jump]);

  useEffect(() => {
    api.get("/ppdb/admin/tahun").then((r) => setTahunList(r.data.data));
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchPendaftar, 500);
    return () => clearTimeout(delay);
  }, [fetchPendaftar]);

  const handleUpdateStatus = async (id, status) => {
    if (status === "Ditolak") {
        setConfirmModal({ isOpen: true, id, type: "tolak", nama: "" });
        setCatatan("");
        return;
    }
    try {
      await api.patch(`/ppdb/admin/pendaftar/${id}/status`, { status });
      showAlert("success", "Status diperbarui");
      fetchPendaftar();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal update status");
    }
  };

  const executeAction = async () => {
      setIsProcessing(true);
      try {
          if (confirmModal.type === 'tolak') {
             await api.patch(`/ppdb/admin/pendaftar/${confirmModal.id}/status`, { status: "Ditolak", catatan_panitia: catatan });
             showAlert("success", "Pendaftar ditolak");
          } else if (confirmModal.type === 'aktivasi') {
             const res = await api.post(`/ppdb/admin/pendaftar/${confirmModal.id}/aktivasi`);
             showAlert("success", res.data.message);
          }
          setConfirmModal({ isOpen: false, id: null, nama: "", type: "" });
          fetchPendaftar();
      } catch (err) {
          showAlert("error", err.response?.data?.message || "Aksi gagal");
      } finally {
          setIsProcessing(false);
      }
  }

  return (
    <>
      <div className="">
        {message.text && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
            {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} 
            <p className="text-sm font-medium">{message.text}</p>
            <button onClick={() => setMessage({type:"", text:""})} className="ml-2 text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Data Pendaftar</h1>
            <p className="text-sm text-gray-500">Kelola semua calon santri yang mendaftar</p>
          </div>
          {!isPimpinan && (
            <button
              onClick={() => setShowManual(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition font-medium shadow-lg shadow-green-100"
            >
              <Plus size={18} /> Input Manual
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama / no. pendaftaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 min-w-[180px]">
            <Filter size={16} className="text-gray-400" />
            <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full py-2.5 bg-transparent text-sm focus:outline-none text-gray-700 font-medium"
            >
                <option value="">Semua Gelombang</option>
                {tahunList.map((t) => (
                <option key={t.id} value={t.id}>{t.nama_gelombang}</option>
                ))}
            </select>
          </div>
          <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm focus:outline-none min-w-[160px] font-medium text-gray-700"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50 uppercase tracking-wider text-[11px] font-bold">
                  <th className="px-5 py-4">No. Pendaftaran</th>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">L/P</th>
                  <th className="px-5 py-4">Asal Sekolah</th>
                  <th className="px-5 py-4">Gelombang</th>
                  <th className="px-5 py-4">Dokumen</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Tidak ada data pendaftar</td></tr>
                ) : (
                  currentData.map((p) => {
                    const docsOk = p.ppdb_dokumen?.filter((d) => d.status_verif === "Terverifikasi").length || 0;
                    const docsTotal = p.ppdb_dokumen?.length || 0;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-mono text-xs text-gray-500 font-bold">{p.no_pendaftaran}</td>
                        <td className="px-5 py-4 font-bold text-gray-800">{p.nama_lengkap}</td>
                        <td className="px-5 py-4 text-gray-600 font-medium">{p.jenis_kelamin.charAt(0)}</td>
                        <td className="px-5 py-4 text-gray-600">{p.asal_sekolah || "-"}</td>
                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{p.ppdb_tahun?.nama_gelombang}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-md ${docsOk === docsTotal && docsTotal > 0 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {docsOk}/{docsTotal} valid
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isPimpinan ? (
                             <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider ${STATUS_BADGE[p.status]?.replace('hover:bg-blue-200', '')?.replace('hover:bg-yellow-200', '')?.replace('hover:bg-purple-200', '')?.replace('hover:bg-green-200', '')?.replace('hover:bg-emerald-200', '')?.replace('hover:bg-red-200', '')?.replace('hover:bg-gray-200', '') || "bg-gray-100 text-gray-600"}`}>
                                {p.status?.replace(/_/g, " ")}
                             </span>
                          ) : (
                            <button 
                              onClick={() => setStatusModal({ isOpen: true, id: p.id, currentStatus: p.status, nama: p.nama_lengkap })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition w-fit ${STATUS_BADGE[p.status] || "bg-gray-100 text-gray-600"}`}
                              title="Klik untuk ubah status"
                            >
                              {p.status?.replace(/_/g, " ")}
                              <Edit2 size={12} className="opacity-70" />
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setDetailData(p)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Lihat Detail"
                            >
                              <Eye size={16} />
                            </button>
                            {!isPimpinan && p.status === "Diterima" && !p.id_user_aktif && (
                              <button
                                onClick={() => setConfirmModal({isOpen: true, id: p.id, nama: p.nama_lengkap, type: "aktivasi"})}
                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Aktivasi sebagai Santri"
                              >
                                <UserCheck size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
      </div>

      <PendaftarDetailModal
        isOpen={!!detailData}
        data={detailData}
        onClose={() => setDetailData(null)}
        onRefresh={fetchPendaftar}
      />
      <PendaftarManualModal
        isOpen={showManual}
        tahunList={tahunList}
        onClose={() => setShowManual(false)}
        onSuccess={(msg) => { setShowManual(false); showAlert("success", msg); fetchPendaftar(); }}
      />

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                  {confirmModal.type === 'aktivasi' ? 'Aktivasi Santri' : 'Tolak Pendaftar'}
              </h2>
              <button onClick={() => setConfirmModal({isOpen: false})} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            {confirmModal.type === 'aktivasi' ? (
                <p className="text-gray-600 mb-6 text-sm">Aktivasi <span className="font-bold text-gray-800">{confirmModal.nama}</span> sebagai santri aktif? Aksi ini akan membuatkan akun sistem otomatis.</p>
            ) : (
                <div className="mb-6">
                    <p className="text-gray-600 text-sm mb-2">Masukkan alasan penolakan (opsional):</p>
                    <textarea 
                        value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({isOpen: false})} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm transition hover:bg-gray-200">Batal</button>
              <button 
                onClick={executeAction} disabled={isProcessing} 
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition text-white ${confirmModal.type === 'aktivasi' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : confirmModal.type === 'aktivasi' ? 'Aktivasi' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal.isOpen && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ubah Status</h2>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{statusModal.nama}</p>
              </div>
              <button onClick={() => setStatusModal({isOpen: false})} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X size={18} /></button>
            </div>
            
            <div className="space-y-2 mb-6">
              {STATUS_OPTIONS.filter(s => s.value).map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    handleUpdateStatus(statusModal.id, s.value);
                    setStatusModal({ isOpen: false });
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition ${
                    statusModal.currentStatus === s.value 
                      ? "border-green-500 bg-green-50 text-green-700" 
                      : "border-gray-100 bg-white text-gray-600 hover:border-green-200 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                  {statusModal.currentStatus === s.value && <span className="float-right"><CheckCircle size={16}/></span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}