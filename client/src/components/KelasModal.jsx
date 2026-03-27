import React, { useState, useEffect } from "react";
import api from "../config/api"; 
import { X, Save, Loader2, BookOpen, User } from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function ModalKelas({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const [formData, setFormData] = useState({ kelas: "", tahun_ajaran: "", id_wali: "" });
  const [waliOptions, setWaliOptions] = useState([]);
  const { message, showAlert, clearAlert } = useAlert();

  // Clean Code: Mengubah promise chain menjadi async function yang rapi di dalam useEffect
  useEffect(() => {
    const fetchWali = async () => {
      try {
        const { data } = await api.get("/pengurus/kelas/wali");
        if (data.success) setWaliOptions(data.data);
      } catch (err) {
        console.error("Gagal load wali kelas", err);
      }
    };

    if (isOpen) {
        fetchWali();
        if (isEditing && editData) {
            setFormData({
                kelas: editData.kelas || "",
                tahun_ajaran: editData.tahun_ajaran || "",
                id_wali: editData.id_wali || ""
            });
        } else {
            setFormData({ kelas: "", tahun_ajaran: "", id_wali: "" });
        }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleChange = ({ target: { name, value } }) => {
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kelas || !formData.tahun_ajaran) return showAlert("error", "Nama kelas dan tahun ajaran wajib diisi");
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><BookOpen className="text-green-600" size={20} /> {isEditing ? "Edit Kelas" : "Tambah Kelas"}</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input type="text" name="kelas" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: 10 IPA 1 / Awwaliyah 1" value={formData.kelas} onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                <input type="text" name="tahun_ajaran" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Contoh: 2023/2024" value={formData.tahun_ajaran} onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
                <select name="id_wali" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-white" value={formData.id_wali} onChange={handleChange}>
                    <option value="" disabled>-- Pilih Wali --</option>
                    {waliOptions.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
                </select>
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex justify-center items-center">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} Simpan
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}