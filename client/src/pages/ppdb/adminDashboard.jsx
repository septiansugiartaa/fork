import React, { useState, useEffect, useCallback, useContext } from "react";
import api from "../../config/api";
import TahunModal from "../../components/ppdb/TahunModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";
import { AuthContext } from "../../context/AuthContext";
import {
  Users, CheckCircle, XCircle, Clock,
  Plus, Edit2, Trash2, Award, AlertTriangle, X
} from "lucide-react";

export default function AdminPpdbDashboard() {
  const { user } = useContext(AuthContext);
  const isPimpinan = user?.role?.toLowerCase() === "pimpinan";

  const [stats, setStats] = useState(null);
  const [tahunList, setTahunList] = useState([]);
  const [selectedTahun, setSelectedTahun] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(tahunList, 10);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [modalDelete, setModalDelete] = useState({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, tahunRes] = await Promise.all([
        api.get(`/ppdb/admin/dashboard${selectedTahun ? `?id_tahun=${selectedTahun}` : ""}`),
        api.get("/ppdb/admin/tahun"),
      ]);
      setStats(statsRes.data.data);
      setTahunList(tahunRes.data.data);
      jump(1);
    } catch (err) {
      showAlert("error", "Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  }, [selectedTahun, jump]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/ppdb/admin/tahun/${modalDelete.id}`);
      showAlert("success", "Gelombang PPDB berhasil dihapus");
      setModalDelete({ isOpen: false, id: null });
      fetchData();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (data) => { setEditData(data); setShowModal(true); };
  const openCreate = () => { setEditData(null); setShowModal(true); };

  const statCards = stats
    ? [
        { label: "Total Pendaftar", value: stats.total_pendaftar, icon: <Users size={20} />, color: "bg-blue-500" },
        { label: "Mendaftar", value: stats.per_status?.Mendaftar || 0, icon: <Clock size={20} />, color: "bg-yellow-500" },
        { label: "Lulus Seleksi", value: stats.per_status?.Lulus || 0, icon: <Award size={20} />, color: "bg-green-500" },
        { label: "Diterima", value: stats.per_status?.Diterima || 0, icon: <CheckCircle size={20} />, color: "bg-emerald-500" },
        { label: "Ditolak", value: stats.per_status?.Ditolak || 0, icon: <XCircle size={20} />, color: "bg-red-500" },
      ]
    : [];

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
            <h1 className="text-2xl font-bold text-gray-800">Dashboard PPDB</h1>
            <p className="text-sm text-gray-500">Penerimaan Peserta Didik Baru</p>
          </div>
          {!isPimpinan && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition font-medium shadow-lg shadow-green-100"
            >
              <Plus size={18} /> Tambah Gelombang
            </button>
          )}
        </div>

        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Filter:</span>
          <button
            onClick={() => setSelectedTahun(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              !selectedTahun ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Semua
          </button>
          {tahunList.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTahun(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                selectedTahun === t.id ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.nama_gelombang}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center text-white shadow-sm shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black text-gray-800 leading-none">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="py-4">
          <h2 className="font-bold text-gray-800">Daftar Gelombang PPDB</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100 bg-gray-50/50 uppercase tracking-wider text-[11px] font-bold ">
                  <th className="px-5 py-4">Nama Gelombang</th>
                  <th className="px-5 py-4">TA</th>
                  <th className="px-5 py-4">Tgl Buka</th>
                  <th className="px-5 py-4">Tgl Tutup</th>
                  <th className="px-5 py-4">Kuota</th>
                  <th className="px-5 py-4">Pendaftar</th>
                  <th className="px-5 py-4">Status</th>
                  {!isPimpinan && <th className="px-5 py-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentData.length === 0 ? (
                  <tr><td colSpan={isPimpinan ? 7 : 8} className="text-center py-10 text-gray-400">Belum ada data gelombang.</td></tr>
                ) : (
                  currentData.map((t) => {
                    const now = new Date();
                    const buka = new Date(t.tanggal_buka);
                    const tutup = new Date(t.tanggal_tutup);
                    const isOpen = now >= buka && now <= tutup;
                    const isClosed = now > tutup;
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-bold text-gray-800">{t.nama_gelombang}</td>
                        <td className="px-5 py-4 text-gray-600">{t.tahun_ajaran}</td>
                        <td className="px-5 py-4 text-gray-600">{new Date(t.tanggal_buka).toLocaleDateString("id-ID")}</td>
                        <td className="px-5 py-4 text-gray-600">{new Date(t.tanggal_tutup).toLocaleDateString("id-ID")}</td>
                        <td className="px-5 py-4 font-medium text-gray-700">{t.kuota ?? "∞"}</td>
                        <td className="px-5 py-4 font-bold text-green-600">{t.total_pendaftar}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isOpen ? "bg-green-100 text-green-700" :
                            isClosed ? "bg-gray-100 text-gray-500" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {isOpen ? "Dibuka" : isClosed ? "Ditutup" : "Belum Buka"}
                          </span>
                        </td>
                        {!isPimpinan && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEdit(t)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Edit2 size={16} /></button>
                              <button onClick={() => setModalDelete({isOpen: true, id: t.id})} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
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

      <TahunModal 
        isOpen={showModal} 
        editData={editData} 
        onClose={() => setShowModal(false)} 
        onSuccess={(msg) => { setShowModal(false); showAlert("success", msg || "Data berhasil disimpan"); fetchData(); }} 
      />

      <ConfirmDeleteModal 
        isOpen={modalDelete.isOpen} 
        onClose={() => setModalDelete({ isOpen: false, id: null })} 
        onConfirm={confirmDelete} 
        loading={isDeleting} 
      />
    </>
  );
}