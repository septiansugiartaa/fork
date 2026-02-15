import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Plus, Loader2, Search, Trash2, AlertTriangle } from "lucide-react";

export default function KamarSantriModal({ isOpen, onClose, kamarData, onAssignClick, refreshTrigger }) {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && kamarData) {
      fetchSantri();
    }
  }, [isOpen, kamarData, refreshTrigger]);

  const fetchSantri = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3000/api/pengurus/kamar/${kamarData.id}/santri`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSantriList(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRemoveClick = (santriId, santriNama) => {
    setDeleteConfirm({ id: santriId, nama: santriNama });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsRemoving(true);
    try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:3000/api/pengurus/kamar/${kamarData.id}/santri/${deleteConfirm.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchSantri(); 
        setDeleteConfirm(null);
    } catch (err) { alert("Gagal menghapus santri"); } finally { setIsRemoving(false); }
  };

  if (!isOpen) return null;

  const filteredList = santriList.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] relative z-10">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div><h3 className="font-bold text-gray-800 text-lg">Daftar Penghuni Kamar</h3><p className="text-sm text-gray-500">Kamar: {kamarData?.kamar}</p></div>
          <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500 transition"/></button>
        </div>
        <div className="p-4 border-b border-gray-100 flex gap-3">
            <div className="relative flex-1">
                <input type="text" placeholder="Cari santri..." className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)}/>
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            </div>
            <button onClick={() => onAssignClick(kamarData)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-sm shadow-md transition"><Plus size={16} /> Tambah Penghuni</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500"/></div> : filteredList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredList.map(santri => (
                        <div key={santri.id} className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                    {santri.foto_profil ? <img src={`http://localhost:3000/uploads/${santri.foto_profil}`} alt={santri.nama} className="w-full h-full object-cover"/> : <span className="text-blue-600 font-bold text-sm">{santri.nama.charAt(0)}</span>}
                                </div>
                                <div className="min-w-0"><p className="font-medium text-gray-800 truncate">{santri.nama}</p><p className="text-xs text-gray-500">{santri.nip || "Tanpa NIS"}</p></div>
                            </div>
                            <button onClick={() => handleRemoveClick(santri.id, santri.nama)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            ) : <div className="text-center py-10 text-gray-500 italic">Belum ada penghuni di kamar ini.</div>}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end"><button onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition">Tutup</button></div>
      </div>

      {deleteConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-80 text-center border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
                <p className="text-sm text-gray-600 mb-6">Keluarkan <span className="font-bold text-gray-800">{deleteConfirm.nama}</span> dari kamar ini?</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition">Batal</button>
                    <button onClick={confirmDelete} disabled={isRemoving} className="flex-1 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition flex items-center justify-center">{isRemoving ? <Loader2 className="animate-spin" size={18}/> : "Hapus"}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}