import React, { useState, useEffect, useCallback, useContext } from "react";
import api from "../../config/api";
import SeleksiModal from "../../components/ppdb/SeleksiModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";
import { AuthContext } from "../../context/AuthContext";
import { Search, Eye, Edit2, Award, Filter, AlertTriangle, CheckCircle, X, Loader2, Users, Clock, ClipboardCheck } from "lucide-react";

const STATUS_SELEKSI_BADGE = {
  Belum_Diseleksi: "bg-gray-100 text-gray-600",
  Sedang_Diseleksi: "bg-yellow-100 text-yellow-700",
  Selesai: "bg-green-100 text-green-700",
};

const REKOMENDASI_BADGE = {
  Diterima: "bg-emerald-100 text-emerald-700",
  Ditolak: "bg-red-100 text-red-700",
  Pertimbangan: "bg-orange-100 text-orange-700",
};

export default function PanitiaSeleksi() {
  const { user } = useContext(AuthContext);
  const isPimpinan = user?.role?.toLowerCase() === "pimpinan";

  const [pendaftar, setPendaftar] = useState([]);
  const [tahunList, setTahunList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterSeleksi, setFilterSeleksi] = useState("");
  const [selectedPendaftar, setSelectedPendaftar] = useState(null);
  
  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(pendaftar, 15);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterTahun) params.append("id_tahun", filterTahun);
      if (filterSeleksi) params.append("status_seleksi", filterSeleksi);
      if (search) params.append("search", search);
      const res = await api.get(`/ppdb/panitia/seleksi?${params}`);
      setPendaftar(res.data.data);
      jump(1);
    } catch (err) {
      showAlert("error", "Gagal memuat data seleksi");
    } finally {
      setLoading(false);
    }
  }, [filterTahun, filterSeleksi, search, jump]);

  useEffect(() => {
    api.get("/ppdb/admin/tahun").then((r) => setTahunList(r.data.data));
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchData, 500);
    return () => clearTimeout(delay);
  }, [fetchData]);

  const executePublish = async () => {
    setIsPublishing(true);
    try {
      await api.post(`/ppdb/panitia/pengumuman/${filterTahun}`);
      showAlert("success", "Pengumuman berhasil dipublikasikan");
      setConfirmPublish(false);
      fetchData();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal mempublikasikan");
    } finally {
      setIsPublishing(false);
    }
  };

  const openSeleksi = async (p) => {
    try {
      const res = await api.get(`/ppdb/panitia/seleksi/${p.id}`);
      setSelectedPendaftar(res.data.data);
    } catch (err) {
      showAlert("error", "Gagal memuat detail seleksi");
    }
  };

  return (
    <>
      <div className="">
        {message.text && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === 'error' ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}`}>
            {message.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>} 
            <p className="text-sm font-medium">{message.text}</p>
            <button onClick={() => setMessage({type:"", text:""})} className="ml-2 text-gray-400"><X size={16}/></button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
                {isPimpinan ? "Laporan Hasil Seleksi" : "Penilaian Seleksi"}
            </h1>
            <p className="text-sm text-gray-500">
                {isPimpinan ? "Rekapitulasi nilai dan hasil tes pendaftar" : "Input hasil tes dan seleksi calon santri"}
            </p>
          </div>
          {!isPimpinan && (
            <button
                onClick={() => {
                    if (!filterTahun) return showAlert("error", "Silakan filter gelombang PPDB terlebih dahulu");
                    setConfirmPublish(true);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition font-medium shadow-lg shadow-green-100"
            >
                <Award size={18} /> Publish Pengumuman
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
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
          <select
            value={filterSeleksi}
            onChange={(e) => setFilterSeleksi(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[160px] font-medium text-gray-700"
          >
            <option value="">Semua Status</option>
            <option value="Belum_Diseleksi">Belum Diseleksi</option>
            <option value="Sedang_Diseleksi">Sedang Diseleksi</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        {pendaftar.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              {label: "Total Peserta", value: pendaftar.length, bgColor: "bg-blue-500", icon: <Users size={20} />},
              {label: "Belum Diseleksi", value: pendaftar.filter((p) => !p.ppdb_seleksi || p.ppdb_seleksi.status_seleksi === "Belum_Diseleksi").length, bgColor: "bg-yellow-500", icon: <Clock size={20} />},
              {label: "Penilaian Selesai", value: pendaftar.filter((p) => p.ppdb_seleksi?.status_seleksi === "Selesai").length, bgColor: "bg-green-500", icon: <ClipboardCheck size={20} />},
              {label: "Rekomendasi Terima", value: pendaftar.filter((p) => p.ppdb_seleksi?.rekomendasi === "Diterima").length, bgColor: "bg-emerald-500", icon: <Award size={20} />},
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${c.bgColor} rounded-xl flex items-center justify-center text-white shadow-sm shrink-0`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">{c.label}</p>
                  <p className={`text-2xl font-black text-gray-800 leading-none`}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50 uppercase tracking-wider text-[11px] font-bold">
                  <th className="px-5 py-4">No. Pendaftaran</th>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Asal Sekolah</th>
                  <th className="px-5 py-4">Baca Quran</th>
                  <th className="px-5 py-4 text-center">Nilai Total</th>
                  <th className="px-5 py-4">Status Seleksi</th>
                  <th className="px-5 py-4">Rekomendasi</th>
                  {!isPimpinan && <th className="px-5 py-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.length === 0 ? (
                  <tr><td colSpan={isPimpinan ? 7 : 8} className="text-center py-10 text-gray-400">Tidak ada data peserta seleksi</td></tr>
                ) : (
                  currentData.map((p) => {
                    const seleksi = p.ppdb_seleksi;
                    const statusSeleksi = seleksi?.status_seleksi || "Belum_Diseleksi";
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-mono text-xs text-gray-500 font-bold">{p.no_pendaftaran}</td>
                        <td className="px-5 py-4 font-bold text-gray-800">{p.nama_lengkap}</td>
                        <td className="px-5 py-4 text-gray-600">{p.asal_sekolah || "-"}</td>
                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{p.kemampuan_quran?.replace(/_/g, " ") || "-"}</td>
                        <td className="px-5 py-4 text-center">
                          {seleksi?.nilai_total != null ? (
                            <span className={`font-black text-lg ${seleksi.nilai_total >= 70 ? "text-green-600" : seleksi.nilai_total >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                              {seleksi.nilai_total}
                            </span>
                          ) : <span className="text-gray-300 font-bold">-</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold ${STATUS_SELEKSI_BADGE[statusSeleksi]}`}>
                            {statusSeleksi.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {seleksi?.rekomendasi ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold ${REKOMENDASI_BADGE[seleksi.rekomendasi]}`}>
                              {seleksi.rekomendasi}
                            </span>
                          ) : <span className="text-gray-400 text-xs font-bold">-</span>}
                        </td>
                        {!isPimpinan && (
                          <td className="px-5 py-4">
                            <button
                              onClick={() => openSeleksi(p)}
                              className="flex items-center justify-center w-full gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition"
                            >
                              <Edit2 size={14} />
                              {seleksi?.status_seleksi === "Selesai" ? "Edit" : "Nilai"}
                            </button>
                          </td>
                        )}
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

      <SeleksiModal
        isOpen={!!selectedPendaftar}
        data={selectedPendaftar}
        onClose={() => setSelectedPendaftar(null)}
        onSuccess={() => { setSelectedPendaftar(null); showAlert("success", "Penilaian disimpan"); fetchData(); }}
      />

      {confirmPublish && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><Award size={32} /></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Publish Pengumuman?</h2>
            <p className="text-gray-500 mb-6 text-sm">Semua peserta pada gelombang ini akan dapat melihat hasil seleksi dan status kelulusan mereka di portal publik.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setConfirmPublish(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm transition hover:bg-gray-200">Batal</button>
              <button onClick={executePublish} disabled={isPublishing} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition">
                {isPublishing ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Publish Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}