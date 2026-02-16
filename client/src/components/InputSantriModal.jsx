import React, { useState, useEffect } from "react";
import { X, Save, Loader2, User, Mail, Phone, MapPin, Calendar, School, Home } from "lucide-react"; // Added School & Home icons

export default function InputSantriModal({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  // Initial State
  const initialForm = {
    nip: "",
    nama: "",
    email: "",
    no_hp: "",
    alamat: "",
    jenis_kelamin: "", 
    tempat_lahir: "",
    tanggal_lahir: "",
    password: "",
    kelas_aktif: "-", // New field for display
    kamar_aktif: "-"  // New field for display
  };

  const [formData, setFormData] = useState(initialForm);

  // Load Data saat Edit
  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          ...editData,
          password: "",
          tanggal_lahir: editData.tanggal_lahir ? new Date(editData.tanggal_lahir).toISOString().split('T')[0] : "",
          kelas_aktif: editData.kelas_aktif || "-", // Load pre-formatted data from controller
          kamar_aktif: editData.kamar_aktif || "-"
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
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            {isEditing ? "Edit Data Santri" : "Tambah Santri Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto">
          <form id="santriForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NIS */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                    <input 
                        type="text" name="nip" required
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.nip} onChange={handleChange}
                        placeholder="Nomor Induk"
                    />
                </div>
                
                {/* Nama */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input 
                        type="text" name="nama" required
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.nama} onChange={handleChange}
                        placeholder="Nama Santri"
                    />
                </div>
            </div>

            {/* --- INFO KELAS & KAMAR (DISABLED) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kelas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Saat Ini</label>
                    <div className="relative">
                        <input 
                            type="text" disabled
                            className="w-full pl-9 p-2.5 border border-gray-200 bg-gray-100 text-gray-600 rounded-xl"
                            value={formData.kelas_aktif}
                        />
                        <School className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                </div>

                {/* Kamar */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kamar Saat Ini</label>
                    <div className="relative">
                        <input 
                            type="text" disabled
                            className="w-full pl-9 p-2.5 border border-gray-200 bg-gray-100 text-gray-600 rounded-xl"
                            value={formData.kamar_aktif}
                        />
                        <Home className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                </div>
            </div>
            {/* -------------------------------------- */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                        <input 
                            type="email" name="email"
                            className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email} onChange={handleChange}
                            placeholder="email@contoh.com"
                        />
                        <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                </div>

                {/* No HP */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                    <div className="relative">
                        <input 
                            type="text" name="no_hp"
                            className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.no_hp} onChange={handleChange}
                            placeholder="0812..."
                        />
                        <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                    <input 
                        type="text" name="tempat_lahir"
                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.tempat_lahir} onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                    <div className="relative">
                        <input 
                            type="date" name="tanggal_lahir"
                            className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.tanggal_lahir} onChange={handleChange}
                        />
                        <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <select 
                    name="jenis_kelamin"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.jenis_kelamin} onChange={handleChange}
                >
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Laki_laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea 
                    name="alamat" rows="2"
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    value={formData.alamat} onChange={handleChange}
                    placeholder="Alamat lengkap..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditing ? "Password Baru (Kosongkan jika tidak diganti)" : "Password"}
                </label>
                <input 
                    type="password" name="password"
                    required={!isEditing} 
                    className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password} onChange={handleChange}
                    placeholder="******"
                />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">
                Batal
            </button>
            <button form="santriForm" type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition flex items-center disabled:opacity-70">
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
        </div>

      </div>
    </div>
  );
}