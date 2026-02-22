import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, FileText, CheckCircle } from 'lucide-react';

export default function ProsesLayananModal({ isOpen, onClose, data, onSubmit, saving }) {
  const [formData, setFormData] = useState({
    status_sesudah: "Proses", // Default value
    catatan: ""
  });

  useEffect(() => {
    if (isOpen && data) {
      // Reset form saat modal dibuka
      setFormData({
        status_sesudah: data.status_sesudah === "Proses" ? "Proses" : "Selesai",
        catatan: data.catatan || ""
      });
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.status_sesudah) return alert("Pilih status terlebih dahulu");
    onSubmit(data.id, formData);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            Tindak Lanjut
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20}/></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Info Singkat */}
            <div className="bg-green-50 p-3 rounded-xl border border-green-100 mb-2">
                <p className="text-xs text-green-600 font-bold uppercase mb-1">Layanan</p>
                <p className="text-sm font-semibold text-gray-800">{data.jenis_layanan?.nama_layanan}</p>
                <p className="text-xs text-gray-500 mt-1">{data.users?.nama}</p>
            </div>

            {/* Status Dropdown */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <div className="relative">
                    <select 
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        value={formData.status_sesudah}
                        onChange={(e) => setFormData({...formData, status_sesudah: e.target.value})}
                    >
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Batal">Batal</option>
                    </select>
                </div>
            </div>

            {/* Catatan */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Petugas</label>
                <div className="relative">
                    <textarea 
                        rows="3"
                        className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        placeholder="Tambahkan catatan penyelesaian..."
                        value={formData.catatan}
                        onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                    />
                    <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex justify-center items-center font-medium transition disabled:opacity-70">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>}
                    Simpan
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}