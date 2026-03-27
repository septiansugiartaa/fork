import { useState, useEffect } from "react";
import api from "../../../config/api";
import { Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react";
import InputJenisTagihanModal from "../../../components/InputJenisTagihanModal";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import AlertToast from "../../../components/AlertToast";
import { useAlert } from "../../../hooks/useAlert";
import usePagination from "../../../components/pagination/usePagination";
import Pagination from "../../../components/pagination/Pagination";

export default function JenisTagihanPage({ rolePrefix }) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList);
  const { message, showAlert, clearAlert } = useAlert();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJenisTagihan = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${rolePrefix}/jenis-tagihan`, { params: { search } });
      setDataList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data jenis tagihan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchJenisTagihan(); jump(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const handleAdd = () => { setIsEditing(false); setSelectedData(null); setIsModalOpen(true); };
  const handleEdit = (data) => { setIsEditing(true); setSelectedData(data); setIsModalOpen(true); };

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/${rolePrefix}/jenis-tagihan/${selectedData.id}`, formData);
        showAlert("success", "Jenis tagihan berhasil diperbarui");
      } else {
        await api.post(`/${rolePrefix}/jenis-tagihan`, formData);
        showAlert("success", "Jenis tagihan baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchJenisTagihan();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => setDeleteModal({ isOpen: true, id: item.id, name: `Jenis Tagihan "${item.jenis_tagihan}"` });

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/${rolePrefix}/jenis-tagihan/${deleteModal.id}`);
      showAlert("success", "Jenis tagihan berhasil dihapus");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchJenisTagihan();
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
        <div><h1 className="text-2xl font-bold text-gray-800">Jenis Tagihan</h1><p className="text-gray-500 text-sm">Master data untuk jenis-jenis tagihan pesantren.</p></div>
        <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-green-500/30 transition">
          <Plus size={20} /><span className="ml-2 hidden md:inline">Tambah Jenis Tagihan</span>
        </button>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari jenis tagihan..." className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} /><p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[60%]">Jenis Tagihan</th><th className="p-4 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-semibold text-gray-800">{item.jenis_tagihan}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="2" className="p-8 text-center text-gray-500">Data jenis tagihan tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? currentData.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{item.jenis_tagihan}</h3>
                    <div className="mt-1"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Aktif</span></div>
                  </div>
                  <button onClick={() => handleDelete(item)} className="text-red-500 bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                </div>
                <button onClick={() => handleEdit(item)} className="mt-1 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 active:scale-95 transition">
                  <Edit2 size={16} /> Edit Jenis
                </button>
              </div>
            )) : <div className="text-center p-8 bg-white rounded-xl border border-gray-100 text-gray-500">Data tidak ditemukan</div>}
          </div>

          <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
        </>
      )}

      <InputJenisTagihanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isEditing={isEditing} editData={selectedData} onSubmit={handleSubmit} saving={isSaving} />
      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} onConfirm={confirmDelete} loading={isDeleting} itemName={deleteModal.name} />
    </div>
  );
}
