import React, { useState, useEffect } from 'react';
import api from '../config/api';
import { X, Save, Loader2, Calendar, FileText, MapPin, ChevronDown } from 'lucide-react';
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function FormLayananModal({ isOpen, onClose, layanan, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [userContext, setUserContext] = useState({ kamar: '', kelas: '' });
  const [locationType, setLocationType] = useState("");
  const { message, showAlert, clearAlert } = useAlert();

  useEffect(() => {
    if (isOpen) {
      setFormData({});
      setLocationType("");
      fetchUserContext();
    }
  }, [isOpen]);

  const fetchUserContext = async () => {
    try {
      const res = await api.get("/santri/layanan/context");
      if (res.data.success) setUserContext(res.data.data);
    } catch (err) {
      console.error("Gagal ambil context", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationType(val);
    if (val === "Kamar") setFormData({ ...formData, lokasi: userContext.kamar || "Belum ada Kamar" });
    else if (val === "Kelas") setFormData({ ...formData, lokasi: userContext.kelas || "Belum ada Kelas" });
    else setFormData({ ...formData, lokasi: "" });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/santri/layanan/ajukan", { id_layanan: layanan.id, form_data: formData });
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      showAlert("error", "Gagal mengirim pengajuan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !layanan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <AlertToast message={message} onClose={clearAlert} />
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div><h3 className="font-bold text-gray-800 text-lg">Formulir Permintaan</h3><p className="text-xs text-green-600 font-medium">Layanan: {layanan.nama_layanan}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] [scrollbar-width:none]">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={14}/> Lokasi Kepergian</label>
            <input type="text" name="lokasi" placeholder="Masukkan lokasi spesifik..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" onChange={handleChange} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar size={14}/> Waktu Izin</label>
            <div className="relative"><input type="datetime-local" name="waktu" className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" onChange={handleChange} /><Calendar className="absolute left-3.5 top-3.5 text-gray-400" size={16} /></div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={14}/> Catatan Tambahan</label>
            <textarea name="catatan" rows="3" placeholder="Tulis instruksi khusus jika ada..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none" onChange={handleChange}></textarea>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Ajukan Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}