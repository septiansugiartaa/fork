import React, { useState, useEffect } from "react";
import api from "../config/api"; 
import { X, User, Plus, Loader2, Trash2, AlertTriangle } from "lucide-react";

export default function ListAnakModal({ isOpen, onClose, ortuData, onAssignClick, refreshTrigger }) {
  const [anakList, setAnakList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRelasi, setConfirmRelasi] = useState({ open: false, id: null });

  useEffect(() => {
    if (isOpen && ortuData) {
      fetchAnak();
    }
  }, [isOpen, ortuData, refreshTrigger]);

  const fetchAnak = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/orangtua/${ortuData.id}/anak`);
      setAnakList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (idRelasi) => setConfirmRelasi({ open: true, id: idRelasi });

  const confirmRemove = async () => {
    try {
      await api.delete(`/admin/orangtua/assign/${confirmRelasi.id}`);
      setConfirmRelasi({ open: false, id: null });
      fetchAnak();
    } catch (err) { console.error(err); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {confirmRelasi.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle size={20} className="text-yellow-600"/></div>
              <h2 className="text-lg font-bold text-gray-800">Putus Relasi</h2>
            </div>
            <div className="px-6 py-5"><p className="text-gray-600">Yakin ingin memutus relasi anak ini?</p></div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setConfirmRelasi({ open: false, id: null })} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition">Batal</button>
              <button onClick={confirmRemove} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition">Putus Relasi</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div><h3 className="font-bold text-gray-800 text-lg">Daftar Anak / Tanggungan</h3><p className="text-xs text-gray-500">Wali: {ortuData?.nama}</p></div>
          <div className="inline-flex items-center gap-2">
            <button onClick={() => onAssignClick(ortuData)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-green-100">
                <Plus size={18} /> Tambah Anak
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mb-2" size={32} /></div>
          ) : anakList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {anakList.map((item) => (
                <div key={item.id_relasi} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-green-200 hover:bg-green-50/30 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.foto_profil ? <img src={`/foto-profil/${item.foto_profil}`} className="w-full h-full object-cover" /> : <User className="text-green-400" size={20}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-sm truncate">{item.nama}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.hubungan} • NIS: {item.nip}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item.id_relasi)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-20 text-gray-400"><User size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada anak yang terhubung.</p></div>}
        </div>
      </div>
    </div>
  );
}