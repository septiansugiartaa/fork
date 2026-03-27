import { useState, useEffect } from "react";
import api from "../../../config/api";
import {
  Plus, Search, Eye, Trash2, Edit2, Loader2,
  MapPin, Calendar, Clock, Users, Globe,
} from "lucide-react";
import CreateKegiatanModal from "../../../components/CreateKegiatanModal";
import DetailKegiatanModal from "../../../components/DetailKegiatanModal";
import ConfirmDeleteModal from "../../../components/ConfirmDeleteModal";
import AlertToast from "../../../components/AlertToast";
import { useAlert } from "../../../hooks/useAlert";
import usePagination from "../../../components/pagination/usePagination";
import Pagination from "../../../components/pagination/Pagination";

export default function KegiatanPage({ rolePrefix }) {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { currentData, currentPage, maxPage, next, prev, jump } = usePagination(dataList);
  const { message, showAlert, clearAlert } = useAlert();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/${rolePrefix}/kegiatan`, { params: { search } });
      if (res.data.success) setDataList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data kegiatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); jump(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const handleOpenDetail = (item) => { setSelectedData(item); setIsDetailOpen(true); };
  const handleOpenCreateForm = () => { setSelectedData(null); setIsFormOpen(true); };
  const handleOpenEditForm = (item) => { setIsDetailOpen(false); setSelectedData(item); setIsFormOpen(true); };

  const handleSubmitForm = async (formData) => {
    setIsSaving(true);
    try {
      let res;
      if (formData.id) {
        res = await api.put(`/${rolePrefix}/kegiatan/${formData.id}`, formData);
      } else {
        res = await api.post(`/${rolePrefix}/kegiatan`, formData);
      }
      if (res.data.success) {
        showAlert("success", res.data.message || "Data berhasil disimpan");
        setIsFormOpen(false);
        fetchData();
      }
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => {
    setIsDetailOpen(false);
    setDeleteModal({ isOpen: true, id: item.id, name: `Kegiatan "${item.nama}"` });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/${rolePrefix}/kegiatan/${deleteModal.id}`);
      showAlert("success", "Kegiatan berhasil dinonaktifkan");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchData();
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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kegiatan</h1>
          <p className="text-gray-500 text-sm">Kelola agenda global dan kegiatan kelas pesantren</p>
        </div>
        <button onClick={handleOpenCreateForm} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium items-center shadow-lg transition-all">
          <Plus size={20} className="mr-2" /> Tambah Kegiatan
        </button>
      </div>

      <button onClick={handleOpenCreateForm} className="w-full md:hidden flex justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition items-center shadow-lg">
        <Plus size={20} className="mr-2" /> Tambah Kegiatan
      </button>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama kegiatan atau lokasi..." className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                    <th className="p-4 w-[30%]">Nama Kegiatan</th>
                    <th className="p-4 w-[20%]">Jadwal</th>
                    <th className="p-4 w-[20%]">Lokasi</th>
                    <th className="p-4 w-[20%]">Skala & Status</th>
                    <th className="p-4 text-center w-[10%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? currentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center overflow-hidden border border-green-100 flex-shrink-0">
                            <Calendar size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate mb-1">{item.nama}</p>
                            {item.rutin && <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">Rutin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 space-y-1 min-w-0">
                          <div className="flex items-center gap-2 truncate"><Calendar size={14} className="text-gray-400" /> {item.tanggal}</div>
                          <div className="flex items-center gap-2 truncate"><Clock size={14} className="text-gray-400" /> {item.waktu}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                          <MapPin size={14} className="text-gray-400 flex-shrink-0" /> <span className="truncate">{item.lokasi}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1.5 min-w-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border truncate ${item.skala.includes("Global") ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                            {item.skala.includes("Global") ? <Globe size={10} /> : <Users size={10} />} {item.skala}
                          </span>
                          <br />
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border truncate ${item.status_waktu === "Mendatang" ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                            {item.status_waktu}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenDetail(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><Eye size={18} /></button>
                          <button onClick={() => handleOpenEditForm(item)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data kegiatan tidak ditemukan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? currentData.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex-shrink-0 overflow-hidden border border-green-100 flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight truncate">{item.nama}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.skala.includes("Global") ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                        {item.skala.includes("Global") ? <Globe size={10} /> : <Users size={10} />} {item.skala}
                      </span>
                      {item.rutin && <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">Rutin</span>}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div className="grid grid-cols-1 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> <span>{item.tanggal}</span></div>
                  <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /> <span>{item.waktu}</span></div>
                  <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{item.lokasi}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button onClick={() => handleOpenDetail(item)} className="py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Eye size={16} /> View</button>
                  <button onClick={() => handleOpenEditForm(item)} className="py-2.5 bg-amber-50 text-amber-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Edit2 size={16} /> Edit</button>
                  <button onClick={() => handleDelete(item)} className="py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition"><Trash2 size={16} /> Hapus</button>
                </div>
              </div>
            )) : <div className="text-center p-8 bg-white rounded-xl border border-gray-100 text-gray-500">Data tidak ditemukan</div>}
          </div>

          <Pagination currentPage={currentPage} totalPages={maxPage} onNext={next} onPrev={prev} />
        </>
      )}

      <CreateKegiatanModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleSubmitForm} isSaving={isSaving} initialData={selectedData} />
      <DetailKegiatanModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} data={selectedData} role={rolePrefix} onEditClick={handleOpenEditForm} onDeleteClick={handleDelete} />
      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} onConfirm={confirmDelete} loading={isDeleting} itemName={deleteModal.name} />
    </div>
  );
}
