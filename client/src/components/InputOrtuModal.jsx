import React, { useState, useEffect } from "react";
import { X, Save, Loader2, User, Phone, Mail, MapPin, Lock } from "lucide-react";

export default function InputOrtuModal({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const initialForm = {
    nama: "", email: "", no_hp: "", jenis_kelamin: "", alamat: "", password: ""
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({ ...editData, password: "" });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <User className="text-green-600" size={20} />
            {isEditing ? "Edit Data Wali" : "Tambah Wali Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="ortuForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                    <input type="text" name="nama" required className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.nama} onChange={handleChange} placeholder="Nama lengkap orang tua/wali" />
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                    <div className="relative">
                        <input type="text" name="no_hp" className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.no_hp} onChange={handleChange} placeholder="08..." />
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                        <input type="email" name="email" className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.email} onChange={handleChange} placeholder="Email aktif" />
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select name="jenis_kelamin" required className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.jenis_kelamin} onChange={handleChange}>
                    <option value="" disabled>Pilih Gender</option>
                    <option value="Laki_laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Tinggal</label>
                <div className="relative">
                    <textarea name="alamat" rows="2" className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" value={formData.alamat} onChange={handleChange} placeholder="Alamat lengkap..." />
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {isEditing && <span className="text-xs text-gray-400 font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <div className="relative">
                    <input type="password" name="password" className="w-full pl-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.password} onChange={handleChange} placeholder={isEditing ? "••••••••" : "Default: ortu123"} />
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">Batal</button>
            <button form="ortuForm" type="submit" disabled={saving} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition flex items-center disabled:opacity-70 shadow-md">
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />} Simpan Data
            </button>
        </div>
      </div>
    </div>
  );
}