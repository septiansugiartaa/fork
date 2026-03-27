import { useState, useEffect } from "react";
import api from "../../../config/api";
import {
  Plus, Search, Edit2, Trash2, Loader2, Mail, Phone,
  MapPin, ExternalLink,
} from "lucide-react";
import InputSantriModal from "../../../components/InputSantriModal";
import ListOrtuModal from "../../../components/ListOrtuModal";
import AssignRelasiModal from "../../../components/AssignRelasiModal";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import AlertToast from "../../../components/AlertToast";
import { useAlert } from "../../../hooks/useAlert";
import usePagination from "../../../components/pagination/usePagination";
import Pagination from "../../../components/pagination/Pagination";

/**
 * DataSantriPage — halaman CRUD santri yang dipakai bersama oleh admin dan pengurus.
 * Satu-satunya perbedaan adalah endpoint API, dikendalikan via prop `rolePrefix`.
 *
 * @param {string} rolePrefix — "admin" | "pengurus"
 */
export default function DataSantriPage({ rolePrefix }) {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(santriList);
  const { message, showAlert, clearAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [listOrtuModal, setListOrtuModal] = useState({ isOpen: false, data: null });
  const [assignModal, setAssignModal] = useState({ isOpen: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSantri = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${rolePrefix}/santri`, { params: { search } });
      setSantriList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data santri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchSantri(); jump(1); }, 500);
    return () => clearTimeout(t);
  }, [search, refreshListKey]);

  const handleAdd = () => { setIsEditing(false); setSelectedData(null); setIsModalOpen(true); };
  const handleEdit = (data) => { setIsEditing(true); setSelectedData(data); setIsModalOpen(true); };

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/${rolePrefix}/santri/${selectedData.id}`, formData);
        showAlert("success", "Data santri berhasil diperbarui");
      } else {
        await api.post(`/${rolePrefix}/santri`, formData);
        showAlert("success", "Santri baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchSantri();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignSubmit = async (payload) => {
    setIsSaving(true);
    try {
      await api.post(`/${rolePrefix}/orangtua/assign`, payload);
      showAlert("success", "Berhasil menghubungkan data wali");
      setAssignModal({ isOpen: false, data: null });
      setRefreshListKey((prev) => prev + 1);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal menghubungkan data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteModal({ isOpen: true, id: item.id, name: `Santri ${item.nama}` });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/${rolePrefix}/santri/${deleteModal.id}`);
      showAlert("success", "Santri berhasil dinonaktifkan");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchSantri();
    } catch {
      showAlert("error", "Gagal menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Data Santri</h1><p className="text-gray-500 text-sm">Kelola data seluruh santri aktif</p></div>
        <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-green-500/30 transition">
          <Plus size={20} /><span className="ml-2 hidden md:inline">Tambah Santri</span>
        </button>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama atau NIS..." className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[35%]">Nama & NIS</th>
                    <th className="p-4 w-[25%]">Kontak</th>
                    <th className="p-4 w-[25%] text-center">Data Wali</th>
                    <th className="p-4 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                            {item.foto_profil ? (
                              <img src={`/foto-profil/${item.foto_profil}`} alt={item.nama} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-green-600 font-bold text-sm bg-green-100 w-full h-full flex items-center justify-center">{item.nama.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0"><p className="font-semibold text-gray-800 truncate">{item.nama}</p><p className="text-xs text-gray-500 truncate">NIS: {item.nip}</p></div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 truncate"><Mail size={14} /> {item.email || "-"}</div>
                          <div className="flex items-center gap-2 truncate"><Phone size={14} /> {item.no_hp || "-"}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => setListOrtuModal({ isOpen: true, data: item })} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition">
                          {item.jumlah_ortu} Wali <ExternalLink size={14} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data santri tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? currentData.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                    {item.foto_profil ? (
                      <img src={`/foto-profil/${item.foto_profil}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold">{item.nama.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.nama}</h3>
                    <p className="text-sm text-gray-500 font-medium">NIS: {item.nip}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-md font-medium border border-green-100">{item.kelas_aktif || "Non-Kelas"}</span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-md font-medium border border-purple-100">{item.kamar_aktif || "Non-Kamar"}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> <span>{item.no_hp || "-"}</span></div>
                  <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{item.alamat || "-"}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button onClick={() => setListOrtuModal({ isOpen: true, data: item })} className="py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition">Wali: {item.jumlah_ortu}</button>
                  <button onClick={() => handleEdit(item)} className="py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"><Edit2 size={14} /> Edit</button>
                  <button onClick={() => handleDelete(item)} className="py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"><Trash2 size={14} /> Hapus</button>
                </div>
              </div>
            )) : <div className="text-center p-8 bg-white rounded-xl text-gray-500">Data tidak ditemukan</div>}
          </div>

          <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
        </>
      )}

      <InputSantriModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isEditing={isEditing} editData={selectedData} onSubmit={handleSubmit} saving={isSaving} userRole={rolePrefix} />

      <ListOrtuModal isOpen={listOrtuModal.isOpen} onClose={() => setListOrtuModal({ isOpen: false, data: null })} santriData={listOrtuModal.data} refreshTrigger={refreshListKey} onAssignClick={(santri) => { setAssignModal({ isOpen: true, data: santri }); setListOrtuModal({ ...listOrtuModal, isOpen: false }); }} />

      <AssignRelasiModal isOpen={assignModal.isOpen} onClose={() => setAssignModal({ isOpen: false, data: null })} mode="ortu" baseData={assignModal.data} onSubmit={handleAssignSubmit} saving={isSaving} />

      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} onConfirm={confirmDelete} loading={isDeleting} itemName={deleteModal.name} />
    </div>
  );
}
