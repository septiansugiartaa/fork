import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Tag, FileText } from "lucide-react";

export default function InputJenisTagihanModal({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const initialForm = {
    jenis_tagihan: ""
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          jenis_tagihan: editData.jenis_tagihan || ""
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.jenis_tagihan) return alert("Nama jenis tagihan wajib diisi");
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Tag className="text-green-600" size={20} />
            {isEditing ? "Edit Jenis Tagihan" : "Tambah Jenis Tagihan"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form id="jenisTagihanForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jenis Tagihan</label>
                <div className="relative">
                    <input 
                        type="text" name="jenis_tagihan" required
                        className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                        value={formData.jenis_tagihan} onChange={handleChange}
                        placeholder="Contoh: SPP Bulanan, Uang Pangkal"
                    />
                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">
                Batal
            </button>
            <button form="jenisTagihanForm" type="submit" disabled={saving} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition flex items-center disabled:opacity-70 shadow-md">
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
        </div>

      </div>
    </div>
  );
}