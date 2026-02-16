import React, { useState, useEffect } from "react";
import { X, Save, Loader2, BedDouble, MapPin } from "lucide-react";

export default function KamarModal({ isOpen, onClose, isEditing, editData, onSubmit, saving }) {
  const [formData, setFormData] = useState({ kamar: "", kapasitas: "", gender: "Laki_laki", lokasi: "" });

  useEffect(() => {
    if (isOpen) {
        if (isEditing && editData) {
            setFormData({ kamar: editData.kamar, kapasitas: editData.kapasitas, gender: editData.gender, lokasi: editData.lokasi });
        } else {
            setFormData({ kamar: "", kapasitas: "", gender: "Laki_laki", lokasi: "" });
        }
    }
  }, [isOpen, isEditing, editData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.kamar) return alert("Nama kamar wajib diisi");
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><BedDouble className="text-blue-600" size={20} /> {isEditing ? "Edit Kamar" : "Tambah Kamar"}</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kamar</label>
                <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: A1" value={formData.kamar} onChange={e => setFormData({...formData, kamar: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                    <input type="number" className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.kapasitas} onChange={e => setFormData({...formData, kapasitas: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="Laki_laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <div className="relative">
                    <input type="text" className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Lantai 1, Gedung A" value={formData.lokasi} onChange={e => setFormData({...formData, lokasi: e.target.value})} />
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex justify-center items-center">{saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} Simpan</button>
            </div>
        </form>
      </div>
    </div>
  );
}