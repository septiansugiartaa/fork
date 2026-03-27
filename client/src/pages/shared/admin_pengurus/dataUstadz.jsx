import { useState, useEffect } from "react";
import api from "../../../config/api";
import { Plus, Search, Edit2, Trash2, Loader2, Mail, Phone, MapPin } from "lucide-react";
import InputUstadzModal from "../../../components/InputUstadzModal";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import AlertToast from "../../../components/AlertToast";
import { useAlert } from "../../../hooks/useAlert";
import usePagination from "../../../components/pagination/usePagination";
import Pagination from "../../../components/pagination/Pagination";

export default function DataUstadzPage({ rolePrefix }) {
  const [ustadzList, setUstadzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(ustadzList);
  const { message, showAlert, clearAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUstadz = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${rolePrefix}/ustadz`, { params: { search } });
      setUstadzList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data ustadz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchUstadz(); jump(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const handleAdd = () => { setIsEditing(false); setSelectedData(null); setIsModalOpen(true); };
  const handleEdit = (data) => { setIsEditing(true); setSelectedData(data); setIsModalOpen(true); };

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/${rolePrefix}/ustadz/${selectedData.id}`, formData);
        showAlert("success", "Data ustadz diperbarui");
      } else {
        await api.post(`/${rolePrefix}/ustadz`, formData);
        showAlert("success", "Ustadz baru ditambahkan");
      }
      setIsModalOpen(false);
      fetchUstadz();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteModal({ isOpen: true, id: item.id, name: `Ustadz ${item.nama}` });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/${rolePrefix}/ustadz/${deleteModal.id}`);
      showAlert("success", "Akun berhasil dinonaktifkan");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchUstadz();
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
        <div><h1 className="text-2xl font-bold text-gray-800">Data Ustadz</h1><p className="text-gray-500 text-sm">Kelola data tenaga pengajar</p></div>
        <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-green-500/30 transition">
          <Plus size={20} /><span className="ml-2 hidden md:inline">Tambah Ustadz</span>
        </button>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama atau NIP..." className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[40%]">Nama & NIP</th>
                    <th className="p-4 w-[25%]">Kontak</th>
                    <th className="p-4 w-[25%]">Jenis Kelamin</th>
                    <th className="p-4 text-center w-[10%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">{item.nama.charAt(0)}</div>
                          <div><p className="font-semibold text-gray-800">{item.nama}</p><p className="text-xs text-gray-500">{item.nip || "Tanpa NIP"}</p></div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2"><Mail size={14} /> {item.email || "-"}</div>
                          <div className="flex items-center gap-2"><Phone size={14} /> {item.no_hp || "-"}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {item.jenis_kelamin ? (item.jenis_kelamin === "Laki_laki" ? "Laki-laki" : "Perempuan") : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? currentData.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center text-orange-600 font-bold border border-orange-200">{item.nama.charAt(0)}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.nama}</h3>
                    <p className="text-sm text-gray-500 font-medium">NIP: {item.nip || "-"}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> <span>{item.no_hp || "-"}</span></div>
                  <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> <span className="truncate">{item.email || "-"}</span></div>
                  <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{item.alamat || "-"}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button onClick={() => handleEdit(item)} className="py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Edit2 size={16} /> Edit</button>
                  <button onClick={() => handleDelete(item)} className="py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Trash2 size={16} /> Hapus</button>
                </div>
              </div>
            )) : <div className="text-center p-8 bg-white rounded-xl border border-gray-100 text-gray-500">Data tidak ditemukan</div>}
          </div>

          <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
        </>
      )}

      <InputUstadzModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isEditing={isEditing} editData={selectedData} onSubmit={handleSubmit} saving={isSaving} userRole={rolePrefix} />
      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} onConfirm={confirmDelete} loading={isDeleting} itemName={deleteModal.name} />
    </div>
  );
}
