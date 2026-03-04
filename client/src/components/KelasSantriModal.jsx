import React, { useState, useEffect } from "react";
import api from "../config/api"; // MENGGUNAKAN API GLOBAL
import { X, User, Plus, Loader2, Search, Trash2, AlertTriangle } from "lucide-react";

export default function KelasSantriModal({ isOpen, onClose, kelasData, onAssignClick, refreshTrigger }) {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && kelasData) {
      fetchSantri();
    }
  }, [isOpen, kelasData, refreshTrigger]);

  const fetchSantri = async () => {
    setLoading(true);
    try {
      // Clean code: Gunakan destructuring dan rute proxy API
      const { data } = await api.get(`/pengurus/kelas/${kelasData.id}/santri`);
      setSantriList(data.data || []);
    } catch (err) {
      console.error("Gagal memuat data santri kelas", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setIsRemoving(true);
    try {
      await api.delete(`/pengurus/penempatan-kelas/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchSantri();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  // Clean Code: Safe navigation agar error property undefined tidak muncul
  const filteredSantri = santriList.filter(s => 
    s?.nama?.toLowerCase().includes(search.toLowerCase()) || 
    s?.nip?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] relative">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div><h3 className="font-bold text-gray-800 text-lg">Daftar Santri Kelas</h3><p className="text-xs text-gray-500">{kelasData?.kelas} — TA {kelasData?.tahun_ajaran}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-white">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Cari santri..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <button onClick={() => onAssignClick(kelasData)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md shadow-green-100"><Plus size={18} /> Tambah Santri</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mb-2" size={32} /><p className="text-sm">Memuat data santri...</p></div>
          ) : filteredSantri.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredSantri.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between group hover:border-green-200 hover:bg-green-50/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      {/* Clean Code: rute gambar proxy relatif */}
                      {item.foto_profil ? <img src={`/foto-profil/${item.foto_profil}`} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold text-xs">{item.nama?.charAt(0)}</div>}
                    </div>
                    <div className="min-w-0"><p className="font-bold text-gray-800 text-sm truncate">{item.nama}</p><p className="text-[10px] text-gray-400">NIS: {item.nip}</p></div>
                  </div>
                  <button onClick={() => setDeleteConfirm({ id: item.id, nama: item.nama })} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-20 text-gray-400"><User size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada santri di kelas ini.</p></div>}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end"><button onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition">Tutup</button></div>
        
        {deleteConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 text-center border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
              <p className="text-sm text-gray-600 mb-6">Keluarkan <span className="font-bold text-gray-800">{deleteConfirm.nama}</span> dari kelas ini?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">Batal</button>
                <button onClick={confirmDelete} disabled={isRemoving} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition flex items-center justify-center">{isRemoving ? <Loader2 className="animate-spin" size={18}/> : "Keluarkan"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}