import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Loader2, BookOpen, User } from "lucide-react";

export default function ModalKelas({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const [formData, setFormData] = useState({ kelas: "", tahun_ajaran: "", id_wali: "" });
  const [waliOptions, setWaliOptions] = useState([]);

  // Fetch Wali Options saat modal dibuka
  useEffect(() => {
    if (isOpen) {
        axios.get("http://localhost:3000/api/pengurus/kelas/wali", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => setWaliOptions(res.data.data)).catch(console.error);

        if (isEditing && editData) {
            setFormData({
                kelas: editData.kelas,
                tahun_ajaran: editData.tahun_ajaran,
                id_wali: editData.id_wali
            });
        } else {
            setFormData({ kelas: "", tahun_ajaran: "", id_wali: "" });
        }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.tahun_ajaran) return alert("Nama kelas dan tahun ajaran wajib diisi");
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><BookOpen className="text-blue-600" size={20} /> {isEditing ? "Edit Kelas" : "Tambah Kelas"}</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 10 IPA 1 / Awwaliyah 1" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 2023/2024" value={formData.tahun_ajaran} onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
                <select className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-white" value={formData.id_wali} onChange={e => setFormData({...formData, id_wali: e.target.value})}>
                    <option value="" disabled>-- Pilih Wali --</option>
                    {waliOptions.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
                </select>
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex justify-center items-center">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} Simpan
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}