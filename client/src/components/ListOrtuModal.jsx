import React, { useState, useEffect } from "react";
import api from "../config/api"; 
import { X, User, Plus, Loader2, Trash2 } from "lucide-react";

export default function ListOrtuModal({ isOpen, onClose, santriData, onAssignClick, refreshTrigger }) {
  const [ortuList, setOrtuList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && santriData) {
      fetchOrtu();
    }
  }, [isOpen, santriData, refreshTrigger]);

  const fetchOrtu = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/santri/${santriData.id}/ortu`);
      setOrtuList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (idRelasi) => {
      if(!window.confirm("Putus relasi wali ini? Akses aplikasi mereka ke santri ini akan dicabut.")) return;
      try {
          await api.delete(`/admin/orangtua/assign/${idRelasi}`);
          fetchOrtu();
      } catch (err) {
          console.error(err);
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div><h3 className="font-bold text-gray-800 text-lg">Daftar Wali / Orang Tua</h3><p className="text-xs text-gray-500">Santri: {santriData?.nama}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400"><X size={20} /></button>
        </div>
        
        <div className="p-4 border-b border-gray-100 flex justify-end bg-white">
          <button onClick={() => onAssignClick(santriData)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-green-100">
              <Plus size={18} /> Tambah Wali
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mb-2" size={32} /></div>
          ) : ortuList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ortuList.map((item) => (
                <div key={item.id_relasi} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-green-200 hover:bg-green-50/30 transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.foto_profil ? <img src={`/foto-profil/${item.foto_profil}`} className="w-full h-full object-cover" /> : <User className="text-green-400" size={20}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-sm truncate">{item.nama}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.hubungan} • HP: {item.no_hp}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(item.id_relasi)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-20 text-gray-400"><User size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada wali yang terhubung.</p></div>}
        </div>
      </div>
    </div>
  );
}