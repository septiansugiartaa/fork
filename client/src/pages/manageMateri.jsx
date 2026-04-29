// client/src/pages/manageMateri.jsx
// Halaman Timkes untuk manage materi + review pengajuan dari user.
// - Tab "Daftar Materi": materi yang sudah publish, dipisah Teori vs Pengalaman
// - Tab "Pengajuan Masuk": daftar pengajuan user dengan aksi Setujui / Tolak / Edit

import { useState, useEffect } from "react";
import api from "../config/api";
import {
  Search, Plus, CheckCircle, XCircle, Edit2, Trash2,
  ClipboardList, BookOpen, Clock, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import CardMateri from "../components/CardMateri";
import CreateMateriModal from "../components/CreateMateriModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ReviewPengajuanModal from "../components/ReviewPengajuanModal";
import AlertToast from "../components/AlertToast";

const TAB_MATERI    = "materi";
const TAB_PENGAJUAN = "pengajuan";

const STATUS_CFG = {
  ditinjau:  { label: "Ditinjau",  cls: "text-amber-600 bg-amber-50 border-amber-200" },
  disetujui: { label: "Disetujui", cls: "text-green-600 bg-green-50 border-green-200" },
  ditolak:   { label: "Ditolak",   cls: "text-red-600   bg-red-50   border-red-200"   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.ditinjau;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function MateriManage() {
  // ── State: Daftar Materi ──────────────────────────────────
  const [materi, setMateri]               = useState([]);
  const [search, setSearch]               = useState("");
  const [loadingMateri, setLoadingMateri] = useState(true);
  const [isCreateOpen, setIsCreateOpen]   = useState(false);
  const [materiToEdit, setMateriToEdit]   = useState(null);
  const [deleteId, setDeleteId]           = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // ── State: Pengajuan ──────────────────────────────────────
  const [pengajuan, setPengajuan]         = useState([]);
  const [loadingPengajuan, setLoadingPengajuan] = useState(true);
  const [selectedPengajuan, setSelectedPengajuan] = useState(null);
  const [isReviewOpen, setIsReviewOpen]   = useState(false);

  // ── State: UI ─────────────────────────────────────────────
  const [activeTab, setActiveTab]         = useState(TAB_MATERI);
  const [alert, setAlert]                 = useState({ show: false, message: "", type: "success" });

  // ── Fetch ─────────────────────────────────────────────────
  const fetchMateri = async () => {
    try {
      setLoadingMateri(true);
      const res = await api.get("/global/manageMateri");
      if (res.data.success) setMateri(res.data.data.list_materi);
      else setMateri([]);
    } catch (err) {
      console.error("fetchMateri:", err);
    } finally {
      setLoadingMateri(false);
    }
  };

  const fetchPengajuan = async () => {
    try {
      setLoadingPengajuan(true);
      const res = await api.get("/timkesehatan/pengajuanMateri");
      if (res.data.success) setPengajuan(res.data.data.list_pengajuan);
      else setPengajuan([]);
    } catch (err) {
      console.error("fetchPengajuan:", err);
    } finally {
      setLoadingPengajuan(false);
    }
  };

  useEffect(() => {
    fetchMateri();
    fetchPengajuan();
  }, []);

  // ── Alert helper ──────────────────────────────────────────
  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 3500);
  };

  // ── Delete materi ─────────────────────────────────────────
  const handleConfirmDelete = async () => {
    try {
      setLoadingDelete(true);
      await api.delete(`/global/manageMateri/${deleteId}`);
      await fetchMateri();
      setShowDeleteModal(false);
      setDeleteId(null);
      showAlert("Materi berhasil dihapus.");
    } catch (err) {
      console.error(err);
      showAlert("Gagal menghapus materi.", "error");
    } finally {
      setLoadingDelete(false);
    }
  };

  // ── Filter & split materi ─────────────────────────────────
  const filteredMateri   = materi.filter((m) =>
    m.judul.toLowerCase().includes(search.toLowerCase())
  );
  const materiTeori      = filteredMateri.filter((m) => m.sumber !== "pengalaman");
  const materiPengalaman = filteredMateri.filter((m) => m.sumber === "pengalaman");

  // Hitung badge pengajuan ditinjau
  const countDitinjau = pengajuan.filter((p) => p.status === "ditinjau").length;

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert.show && (
        <AlertToast
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: "", type: "success" })}
        />
      )}

      {/* ── Header Page ────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Materi</h1>
          <p className="text-gray-500 text-sm">Kelola materi penyakit scabies</p>
        </div>

        {activeTab === TAB_MATERI && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition duration-200"
          >
            <Plus size={20} />
            <span className="ml-2 hidden md:inline">Tambah Materi</span>
          </button>
        )}
      </div>

      {/* ── Tab Bar ────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab(TAB_MATERI)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === TAB_MATERI
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen size={16} />
          Daftar Materi
        </button>
        <button
          onClick={() => setActiveTab(TAB_PENGAJUAN)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === TAB_PENGAJUAN
              ? "bg-white text-gray-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardList size={16} />
          Pengajuan Masuk
          {countDitinjau > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {countDitinjau}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB: DAFTAR MATERI                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === TAB_MATERI && (
        <>
          {/* Search */}
          <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari judul materi..."
                className="w-full pl-10 pr-4 py-2.5 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingMateri ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm">Memuat materi...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* ── Materi Berdasarkan Teori ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-800">Materi Berdasarkan Teori</h2>
                  <span className="text-xs text-gray-400 font-normal">({materiTeori.length} materi)</span>
                </div>

                {materiTeori.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materiTeori.map((item) => (
                      <CardMateri
                        key={item.id}
                        materi={item}
                        isManage={true}
                        detailBasePath="/timkesehatan/manageMateri"
                        onDelete={(id) => { setDeleteId(id); setShowDeleteModal(true); }}
                        onEdit={(m) => { setMateriToEdit(m); setIsCreateOpen(true); }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
                    Belum ada materi teori.
                  </div>
                )}
              </section>

              {/* ── Materi Berdasarkan Pengalaman ── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1 h-6 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-800">Materi Berdasarkan Pengalaman</h2>
                  <span className="text-xs text-gray-400 font-normal">({materiPengalaman.length} materi)</span>
                </div>

                {materiPengalaman.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materiPengalaman.map((item) => (
                      <CardMateri
                        key={item.id}
                        materi={item}
                        isManage={true}
                        detailBasePath="/timkesehatan/manageMateri"
                        onDelete={(id) => { setDeleteId(id); setShowDeleteModal(true); }}
                        onEdit={(m) => { setMateriToEdit(m); setIsCreateOpen(true); }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
                    Belum ada materi dari pengajuan yang disetujui.
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAB: PENGAJUAN MASUK                                */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeTab === TAB_PENGAJUAN && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingPengajuan ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="text-sm">Memuat pengajuan...</p>
            </div>
          ) : pengajuan.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Belum ada pengajuan materi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Tanggal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Judul</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Penulis</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pengajuan.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(item.tanggal_pengajuan).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium max-w-xs">
                        <div className="truncate">{item.judul}</div>
                        {item.ringkasan && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">{item.ringkasan}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.penulis}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4">
                        {item.status === "ditinjau" ? (
                          <button
                            onClick={() => { setSelectedPengajuan(item); setIsReviewOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-600 hover:text-white transition"
                          >
                            <Edit2 size={13} />
                            Tinjau
                          </button>
                        ) : (
                          <button
                            onClick={() => { setSelectedPengajuan(item); setIsReviewOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                          >
                            Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      <CreateMateriModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setMateriToEdit(null); }}
        refreshMateri={fetchMateri}
        materiToEdit={materiToEdit}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        loading={loadingDelete}
      />

      <ReviewPengajuanModal
        isOpen={isReviewOpen}
        pengajuan={selectedPengajuan}
        onClose={() => { setIsReviewOpen(false); setSelectedPengajuan(null); }}
        onUpdate={() => {
          fetchPengajuan();
          fetchMateri();
          showAlert("Status pengajuan berhasil diperbarui.");
        }}
      />
    </div>
  );
}
