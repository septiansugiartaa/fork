import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Loader2, Home, User } from "lucide-react";

export default function AssignKamarModal({ isOpen, onClose, isEditing, editData, onSubmit, saving, preSelectedKamar }) {
  const [formData, setFormData] = useState({ id_santri: "", id_kamar: preSelectedKamar ? preSelectedKamar.id : "" });
  const [santriOptions, setSantriOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (isOpen) {
        fetchSantriOptions();
        if (isEditing && editData) {
            setFormData({ id_santri: editData.users.id, id_kamar: editData.kamar.id });
        } else {
            setFormData({ id_santri: "", id_kamar: preSelectedKamar ? preSelectedKamar.id : "" });
        }
    }
  }, [isOpen, isEditing, editData, preSelectedKamar]);

  const fetchSantriOptions = async () => {
    setLoadingOptions(true);
    try {
        const token = localStorage.getItem("token");
        
        const targetGender = editData?.kamar?.gender || preSelectedKamar?.gender || "";
        if (targetGender != "Perempuan"){
            const targetGender = "Laki-laki";
        }

        const res = await axios.get(`http://localhost:3000/api/pengurus/penempatan-kamar/options?gender=${targetGender}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setSantriOptions(res.data.santri);
    } catch (err) { 
        console.error(err); 
    } finally { 
        setLoadingOptions(false); 
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id_santri || !formData.id_kamar) return alert("Pilih Santri!");
    onSubmit(formData);
  };

  const displayKamarName = editData?.kamar?.kamar || preSelectedKamar?.kamar || "Loading...";
  const displayLokasi = editData?.kamar?.lokasi || preSelectedKamar?.lokasi || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Home className="text-green-600" size={20} /> {isEditing ? "Pindah Kamar Santri" : "Tambah Santri ke Kamar"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {loadingOptions ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-green-500"/></div> : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kamar Tujuan</label>
                        <div className="relative">
                            <input type="text" disabled className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-medium" value={`${displayKamarName} (${displayLokasi})`} />
                            <Home className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input type="hidden" name="id_kamar" value={formData.id_kamar} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Santri</label>
                        <div className="relative">
                            <select className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white disabled:bg-gray-100" value={formData.id_santri} onChange={(e) => setFormData({...formData, id_santri: e.target.value})} disabled={isEditing}>
                                <option value="">-- Cari Nama Santri --</option>
                                {santriOptions.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.nip})</option>)}
                            </select>
                            <User className="absolute left-3 top-3 text-gray-400" size={16} />
                        </div>
                    </div>
                </>
            )}
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">Batal</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex justify-center items-center font-medium shadow-lg transition">{saving ? <Loader2 className="animate-spin mr-2" size={18}/> : <Save className="mr-2" size={18}/>} Simpan</button>
            </div>
        </form>
      </div>
    </div>
  );
}