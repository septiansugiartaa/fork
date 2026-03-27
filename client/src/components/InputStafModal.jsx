import React, { useState, useEffect } from "react";
import { X, Save, Loader2, ShieldAlert, KeyRound } from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function InputStafModal({ isOpen, onClose, isEditing, editData, onSubmit, onResetPassword, saving }) {
  const initialForm = {
    nip: "",
    nama: "",
    email: "",
    no_hp: "",
    jenis_kelamin: "",
    roles: [],
  };
  const { message, showAlert, clearAlert } = useAlert();

  const [formData, setFormData] = useState(initialForm);
  const availableRoles = ["Admin", "Pimpinan", "Tim Kesehatan", "Pengurus", "Ustadz"];

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          nip: editData.nip !== "-" ? editData.nip : "",
          nama: editData.nama || "",
          email: editData.email !== "-" ? editData.email : "",
          no_hp: editData.no_hp !== "-" ? editData.no_hp : "",
          jenis_kelamin: editData.jenis_kelamin || "",
          roles: editData.roles || [],
        });
      } else {
        setFormData(initialForm);
      }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (roleName) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleName) 
        ? prev.roles.filter(r => r !== roleName) 
        : [...prev.roles, roleName]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.roles.length === 0) return showAlert("error", "Pilih minimal 1 Hak Akses (Role)!");
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <ShieldAlert className="text-green-600" size={20} />
            {isEditing ? "Edit Akun & Otorisasi" : "Registrasi Staf Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="stafForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" name="nama" required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.nama} onChange={handleChange} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input type="text" name="nip" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.nip} onChange={handleChange} placeholder="Nomor Induk Pegawai" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.email} onChange={handleChange} placeholder="email@pesantren.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                <input type="text" name="no_hp" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={formData.no_hp} onChange={handleChange} placeholder="0812..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select name="jenis_kelamin" required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white" value={formData.jenis_kelamin} onChange={handleChange}>
                <option value="" disabled>Pilih Jenis Kelamin</option>
                <option value="Laki_laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-2">Penugasan Hak Akses (Bisa pilih lebih dari 1)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableRoles.map((role) => (
                  <label key={role} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${formData.roles.includes(role) ? "bg-green-50 border-green-500 text-green-800 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" checked={formData.roles.includes(role)} onChange={() => handleRoleToggle(role)} />
                    <span className="font-medium text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {!isEditing && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-xs font-medium mt-4">
                Info: Password default untuk akun baru adalah <span className="font-bold text-black">12345678</span>
              </div>
            )}
          </form>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
          {isEditing ? (
            <button type="button" onClick={() => onResetPassword(editData.id)} className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-semibold text-sm rounded-xl transition flex items-center">
              <KeyRound size={16} className="mr-2" /> Reset Password
            </button>
          ) : <div />}

          <div className="flex gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition">Batal</button>
            <button form="stafForm" type="submit" disabled={saving} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition flex items-center disabled:opacity-70 shadow-lg">
              {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}