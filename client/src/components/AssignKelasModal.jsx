import React, { useState, useEffect } from "react";
import api from "../config/api";
import { X, Save, Loader2, School, User } from "lucide-react";

export default function ModalAssignKelas({ isOpen, onClose, isEditing, editData, onSubmit, saving, preSelectedKelas }) {
  const [formData, setFormData] = useState({ id_santri: "", id_kelas: preSelectedKelas ? preSelectedKelas.id : "" });
  const [santriOptions, setSantriOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    if (isOpen) {
        fetchSantriOptions();
        if (isEditing && editData) {
            setFormData({ id_santri: editData.users.id, id_kelas: editData.kelas.id });
        } else {
            setFormData({ id_santri: "", id_kelas: preSelectedKelas ? preSelectedKelas.id : "" });
        }
    }
  }, [isOpen, isEditing, editData, preSelectedKelas]);

  const fetchSantriOptions = async () => {
    setLoadingOptions(true);
    try {
        const res = await api.get("/pengurus/penempatan-kelas/options");
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
    if (!formData.id_santri || !formData.id_kelas) return alert("Pilih Santri!");
    onSubmit(formData);
  };

  const displayKelasName = editData?.kelas?.kelas || preSelectedKelas?.kelas || "Loading...";
  const displayTahunAjaran = editData?.kelas?.tahun_ajaran || preSelectedKelas?.tahun_ajaran || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><School className="text-green-600" size={20} /> Tambah Santri ke Kelas</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {loadingOptions ? <div className="text-center py-4"><Loader2 className="animate-spin mx-auto text-green-500"/></div> : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Tujuan</label>
                        <div className="relative">
                            <input type="text" disabled className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-medium" value={`${displayKelasName} (${displayTahunAjaran})`} />
                            <School className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input type="hidden" name="id_kelas" value={formData.id_kelas} />
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