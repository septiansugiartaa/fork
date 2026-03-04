import { useState, useEffect } from "react";
import api from "../config/api";
import { X, Loader2 } from "lucide-react";

export default function CreatePengaduanModal({ isOpen, onClose, onSubmit, isSaving }) {
    const [santris, setSantris] = useState([]);
    const [formData, setFormData] = useState({ id_santri: "", judul: "", deskripsi: "" });
    
    const fetchSantriOptions = async () => {
        try {
            const res = await api.get("/ustadz/pengaduan/santri-options");
            if (res.data.success) setSantris(res.data.data);
        } catch (err) {
            console.error("Gagal load santri", err);
        }
    };
        
    useEffect(() => {
        if (isOpen) {
            setFormData({ id_santri: "", judul: "", deskripsi: "" });
            fetchSantriOptions();
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div><h3 className="font-bold text-gray-800 text-lg">Buat Pengaduan Baru</h3><p className="text-xs text-gray-500">Laporkan pelanggaran santri</p></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-white shadow-sm p-2 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form id="form-pengaduan" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-5">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pilih Santri</label><select required value={formData.id_santri} onChange={(e) => setFormData({...formData, id_santri: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-700"><option value="" disabled>-- Pilih Santri --</option>{santris.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.nip})</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Judul Laporan</label><input required type="text" value={formData.judul} onChange={(e) => setFormData({...formData, judul: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Contoh: Terlambat Sholat" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deskripsi</label><textarea required rows="4" value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Jelaskan detail..."></textarea></div>
                    </form>
                </div>
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Batal</button>
                    <button type="submit" form="form-pengaduan" disabled={isSaving} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center shadow-md">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Kirim Laporan"}
                    </button>
                </div>
            </div>
        </div>
    );
}