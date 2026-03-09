import React, { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Globe,
  Eye,
} from "lucide-react";

import DetailKegiatanModal from "../../components/DetailKegiatanModal";
import CreateKegiatanModal from "../../components/CreateKegiatanModal";
import usePagination from "../../components/pagination/usePagination";
import Pagination from "../../components/pagination/Pagination";

export default function PengurusKegiatan() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshListKey, setRefreshListKey] = useState(0);

  const { currentData, currentPage, maxPage, next, prev, jump } =
    usePagination(dataList);

  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/pengurus/kegiatan", { params: { search } });
      setDataList(res.data.data);
    } catch {
      showAlert("error", "Gagal memuat data kegiatan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
      jump(1);
    }, 500);
    return () => clearTimeout(delay);
  }, [search, refreshListKey]);

  const handleOpenDetail = (item) => {
    setSelectedKegiatan(item);
    setIsDetailOpen(true);
  };

  const handleOpenCreateForm = () => {
    setSelectedKegiatan(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item) => {
    setIsDetailOpen(false);
    setSelectedKegiatan(item);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (formData) => {
    setIsSaving(true);
    try {
      const payload = { ...formData, id_kelas: null };

      if (formData.id) {
        await api.put(`/pengurus/kegiatan/${formData.id}`, payload);
        showAlert("success", "Kegiatan berhasil diperbarui");
      } else {
        await api.post("/pengurus/kegiatan", payload);
        showAlert("success", "Kegiatan baru ditambahkan");
      }
      setIsFormOpen(false);
      setRefreshListKey((prev) => prev + 1);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus kegiatan ini?")) return;
    try {
      await api.delete(`/pengurus/kegiatan/${id}`);
      showAlert("success", "Kegiatan dihapus");
      setIsDetailOpen(false);
      fetchData();
    } catch {
      showAlert("error", "Gagal menghapus kegiatan");
    }
  };

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[11000] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 bg-white ${message.type === "error" ? "border-red-500 text-red-700" : "border-green-500 text-green-700"}`}
        >
          {message.type === "error" ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}{" "}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Kegiatan Pesantren
          </h1>
          <p className="text-gray-500 text-sm">
            Kelola agenda dan acara berskala global
          </p>
        </div>
        <button
          onClick={handleOpenCreateForm}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition"
        >
          <Plus size={20} />
          <span className="ml-2 hidden md:inline">Tambah Kegiatan</span>
        </button>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 outline-none transition-all">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama kegiatan..."
            className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="animate-spin text-green-500 mx-auto mb-2" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* VIEW DESKTOP: TABLE */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 w-[25%]">Nama Kegiatan</th>
                    <th className="p-4 w-[20%]">Waktu & Tanggal</th>
                    <th className="p-4 w-[20%]">Lokasi</th>
                    <th className="p-4 w-[15%]">Status</th>
                    <th className="p-4 text-center w-[20%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">
                            {item.nama}
                          </p>
                          <p className="text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                            {item.id_kelas ? (
                              <Users size={10} />
                            ) : (
                              <Globe size={10} />
                            )}{" "}
                            {item.skala}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />{" "}
                            {item.tanggal}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-gray-400" />{" "}
                            {item.waktu}
                          </p>
                        </td>
                        <td className="p-4 text-gray-600 text-sm flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />{" "}
                          {item.lokasi}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                            {item.status_waktu}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleOpenDetail(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Lihat Detail"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        Data kegiatan kosong.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* VIEW MOBILE: CARD */}
          <div className="block md:hidden space-y-4">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {item.nama}
                        </h3>
                        <span
                          className={`inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold items-center gap-1 w-fit border ${item.id_kelas ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}
                        >
                          {item.id_kelas ? (
                            <Users size={10} />
                          ) : (
                            <Globe size={10} />
                          )}{" "}
                          {item.skala}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded-md font-bold uppercase tracking-wider">
                        {item.status_waktu}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />{" "}
                        {item.tanggal}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />{" "}
                        {item.waktu}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />{" "}
                        <span className="truncate">{item.lokasi || "-"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm flex justify-center items-center"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEditForm(item)}
                        className="py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex justify-center items-center"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="py-2 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex justify-center items-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 bg-white rounded-xl border border-gray-100 text-gray-500">
                Data kosong.
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={maxPage}
            onNext={next}
            onPrev={prev}
          />
        </>
      )}

      {/* Modals Tetap Sama */}
      <CreateKegiatanModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
        isSaving={isSaving}
        initialData={selectedKegiatan}
        myClasses={[]}
      />

      <DetailKegiatanModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedKegiatan}
        role="pengurus"
        onEditClick={handleOpenEditForm}
        onDeleteClick={handleDelete}
      />
    </div>
  );
}
