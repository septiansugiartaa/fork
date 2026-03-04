import React, { useState, useEffect } from "react";
import { X, Save, Loader2, User, Mail, Phone, MapPin, Calendar, School, Home } from "lucide-react";

export default function InputSantriModal({ isOpen, onClose, isEditing, editData, onSubmit, saving, userRole }) {
  const initialForm = { 
    nip: "", nama: "", email: "", no_hp: "", alamat: "", 
    jenis_kelamin: "", tempat_lahir: "", tanggal_lahir: "", 
    password: "", kelas_aktif: "-", kamar_aktif: "-" 
  };
  
  const [formData, setFormData] = useState(initialForm);
  const isReadOnly = !["pengurus", "admin"].includes(userRole?.toLowerCase());

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          ...editData,
          password: "", // Jangan tampilkan password lama
          // Clean code: Gunakan optional chaining dan pastikan format date ISO valid
          tanggal_lahir: editData.tanggal_lahir ? new Date(editData.tanggal_lahir).toISOString().split("T")[0] : ""
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, isEditing, editData]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition disabled:bg-gray-50";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <User className="text-green-600" size={20} /> {isReadOnly ? "Detail Santri" : isEditing ? "Edit Data Santri" : "Tambah Santri Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <form id="santriForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex justify-center mb-2">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {formData.foto_profil ? <img src={`/foto-profil/${formData.foto_profil}`} className="w-full h-full object-cover" alt="Profil" /> : <User size={40} className="text-gray-300" />}
              </div>
            </div>
            
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">NIS (Nomor Induk Santri)</label><input name="nip" required disabled={isReadOnly} className={inputClass} value={formData.nip} onChange={handleChange} /></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Nama Lengkap</label><input name="nama" required disabled={isReadOnly} className={inputClass} value={formData.nama} onChange={handleChange} /></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Jenis Kelamin</label><select name="jenis_kelamin" required disabled={isReadOnly} className={inputClass} value={formData.jenis_kelamin} onChange={handleChange}><option value="">-- Pilih --</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">No. Handphone</label><input name="no_hp" disabled={isReadOnly} className={inputClass} value={formData.no_hp} onChange={handleChange} /></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Email</label><input name="email" type="email" disabled={isReadOnly} className={inputClass} value={formData.email} onChange={handleChange} /></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Tempat Lahir</label><input name="tempat_lahir" disabled={isReadOnly} className={inputClass} value={formData.tempat_lahir} onChange={handleChange} /></div>
            <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Tanggal Lahir</label><input name="tanggal_lahir" type="date" disabled={isReadOnly} className={inputClass} value={formData.tanggal_lahir} onChange={handleChange} /></div>
            {!isEditing && !isReadOnly && <div className="space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Kata Sandi Akun</label><input name="password" type="password" required className={inputClass} value={formData.password} onChange={handleChange} placeholder="******" /></div>}
            <div className="md:col-span-2 space-y-1"><label className="text-sm font-bold text-gray-600 ml-1">Alamat Rumah</label><textarea name="alamat" disabled={isReadOnly} className={`${inputClass} resize-none`} rows="2" value={formData.alamat} onChange={handleChange} /></div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-50 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition">
            {isReadOnly ? "Tutup" : "Batal"}
          </button>
          {!isReadOnly && (
            <button form="santriForm" type="submit" disabled={saving} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg disabled:opacity-70">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Simpan Santri
            </button>
          )}
        </div>
      </div>
    </div>
  );
}