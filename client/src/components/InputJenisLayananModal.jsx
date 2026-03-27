import React, { useState, useEffect } from "react";
import { X, Save, Loader2, List, FileText, CreditCard } from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function InputJenisLayananModal({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const initialForm = {
    nama_layanan: "",
    estimasi: "",
    deskripsi: ""
  };
  const { message, showAlert, clearAlert } = useAlert();

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          nama_layanan: editData.nama_layanan || "",
          estimasi: editData.estimasi || "",
          deskripsi: editData.deskripsi || ""
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  // Clean Code: Destructuring event target
  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama_layanan || !formData.estimasi) {
      return showAlert("error", "Nama layanan dan estimasi wajib diisi");
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <List className="text-green-600" size={20} />
            {isEditing ? "Edit Jenis Layanan" : "Tambah Layanan Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <form id="layananForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
                <div className="relative">
                    <input 
                        type="text" name="nama_layanan" required
                        className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        value={formData.nama_layanan} onChange={handleChange}
                        placeholder="Contoh: Izin Bermalam"
                    />
                    <List className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Waktu Pengerjaan (Hari)</label>
                <div className="relative">
                    <input 
                        type="text"
                        name="estimasi" 
                        required
                        className="w-full pl-9 pr-12 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        value={formData.estimasi} 
                        onChange={handleChange}
                        placeholder="Contoh: 1"
                    />
                    <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <span className="absolute right-4 top-2.5 text-gray-500 text-md font-medium pointer-events-none">
                        Hari
                    </span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <div className="relative">
                    <textarea 
                        name="deskripsi" rows="3"
                        className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                        value={formData.deskripsi} onChange={handleChange}
                        placeholder="Keterangan tambahan..."
                    />
                    <FileText className="absolute left-3 top-3.5 text-gray-400" size={16} />
                </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">
                Batal
            </button>
            <button form="layananForm" type="submit" disabled={saving} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition flex items-center disabled:opacity-70">
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
        </div>
      </div>
    </div>
  );
}