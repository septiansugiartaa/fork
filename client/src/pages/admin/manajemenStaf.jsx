import React, { useState, useEffect, useMemo } from "react";
import api from "../../config/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Mail,
  Phone,
} from "lucide-react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";
import InputStafModal from "../../components/InputStafModal";

export default function ManajemenStaf() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { message, showAlert, clearAlert } = useAlert();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/staf");
      if (res.data.success) {
        setDataList(res.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err.response?.data?.message || err.message);
      showAlert("error", "Gagal memuat data staf/pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        (item.nama?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (item.nip?.toLowerCase() || "").includes(search.toLowerCase());

      const matchRole =
        filterRole === "Semua" ||
        item.roles.some((r) => r.toLowerCase() === filterRole.toLowerCase());

      return matchSearch && matchRole;
    });
  }, [dataList, search, filterRole]);

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(
    filteredData,
    10,
  );

  useEffect(() => {
    jump(1);
  }, [filterRole, search, dataList]);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setSelectedData(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/admin/staf/${selectedData.id}`, formData);
        showAlert("success", "Profil dan hak akses berhasil diupdate!");
      } else {
        await api.post("/admin/staf", formData);
        showAlert("success", "Akun staf baru berhasil dibuat!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => setDeleteModal({ isOpen: true, id: item.id, name: `Staf ${item.nama}` });
  
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/admin/staf/${deleteModal.id}`);
      showAlert("success", "Staf dihapus");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchData();
    } catch {
      showAlert("error", "Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Reset password akun ini menjadi 'Pesantren123!' ?")) return;
    try {
      const res = await api.put(`/admin/staf/${id}/reset-password`, {});
      showAlert("success", res.data.message);
      setIsModalOpen(false);
    } catch (err) {
      showAlert("error", "Gagal mereset password");
    }
  };

  const getRoleColor = (role) => {
    const r = role.toLowerCase();
    if (r === "admin") return "bg-gray-800 text-white";
    if (r === "pimpinan") return "bg-purple-100 text-purple-700 border-purple-200";
    if (r === "timkesehatan") return "bg-red-100 text-red-700 border-red-200";
    if (r === "pengurus") return "bg-green-100 text-green-700 border-green-200";
    return "hidden";
  };

  return (
    <div className="space-y-6 relative">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Manajemen Staf</h1>
          <p className="text-gray-500 text-sm">Kelola akun administrator, pimpinan, tim kesehatan, dan pengurus</p>
        </div>
        <button onClick={handleAdd} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium items-center shadow-lg hover:shadow-green-500/30 transition-all">
          <Plus size={20} className="mr-2" /> Tambah Staf Baru
        </button>
      </div>

      <button onClick={handleAdd} className="w-full md:hidden flex justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition items-center shadow-lg">
        <Plus size={20} className="mr-2" /> Tambah Staf Baru
      </button>

      <div className="space-y-3">
        <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all outline-none">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIP staf..."
              className="w-full pl-10 pr-10 py-2.5 outline-none bg-transparent text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 text-gray-400 hover:text-gray-600 transition" title="Hapus pencarian"><X size={18} /></button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {["Semua", "Admin", "Pimpinan", "Tim Kesehatan", "Pengurus"].map((roleName) => (
              <button
                key={roleName}
                onClick={() => setFilterRole(roleName)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                  filterRole === roleName
                    ? "bg-green-600 text-white border-green-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                }`}
              >
                {roleName}
              </button>
            ),
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
          <p className="text-gray-500">Memuat data staf...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden pb-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[35%]">Identitas Staf</th>
                    <th className="p-4 w-[25%]">Hak Akses (Role)</th>
                    <th className="p-4 w-[25%]">Kontak</th>
                    <th className="p-4 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr key={item.id} className="hover:bg-green-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden border border-green-200 flex-shrink-0 text-green-600 font-bold">
                              {item.foto_profil ? (
                                <img src={`/foto-profil/${item.foto_profil}`} alt={item.nama} className="w-full h-full object-cover" />
                              ) : item.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{item.nama}</p>
                              <p className="text-xs text-gray-500 truncate">NIP: {item.nip}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {item.roles.map((r, idx) => (
                              <span key={idx} className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getRoleColor(r)}`}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600 space-y-1 min-w-0">
                            <div className="flex items-center gap-2 truncate"><Mail size={14} className="text-gray-400" /> {item.email}</div>
                            <div className="flex items-center gap-2 truncate"><Phone size={14} className="text-gray-400" /> {item.no_hp}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEdit(item)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition" title="Edit Data & Reset Password"><Edit2 size={18} /></button>
                            <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Nonaktifkan Akun"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="p-12 text-center text-gray-500">Tidak ada staf yang cocok dengan filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-green-200 text-green-600 font-bold text-lg">
                      {item.foto_profil ? (
                        <img src={`/foto-profil/${item.foto_profil}`} alt={item.nama} className="w-full h-full object-cover" />
                      ) : item.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-base leading-tight mb-0.5">{item.nama}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-2">NIP: {item.nip}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.roles.map((r, idx) => (
                          <span key={idx} className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getRoleColor(r)}`}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100"></div>
                  <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> <span>{item.no_hp}</span></div>
                    <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <span className="truncate">{item.email}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button onClick={() => handleEdit(item)} className="py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Edit2 size={16} /> Edit Akun</button>
                    <button onClick={() => handleDelete(item)} className="py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Trash2 size={16} /> Disable</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">Tidak ada data staf</div>
            )}
          </div>

          {maxPage > 0 && <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />}
        </>
      )}

      <InputStafModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        editData={selectedData}
        onSubmit={handleSubmit}
        onResetPassword={handleResetPassword}
        saving={isSaving}
      />
      <ConfirmDeleteModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} 
        onConfirm={confirmDelete} 
        loading={isDeleting} 
        itemName={deleteModal.name} 
      />
    </div>
  );
}