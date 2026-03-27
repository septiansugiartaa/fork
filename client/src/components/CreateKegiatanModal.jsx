import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function CreateKegiatanModal({ isOpen, onClose, onSubmit, isSaving, initialData, myClasses = [] }) {
    const [formData, setFormData] = useState({
        nama_kegiatan: "", tanggal: "", waktu_mulai: "", waktu_selesai: "", lokasi: "", deskripsi: "", id_kelas: ""
    });
    const { message, showAlert, clearAlert } = useAlert();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (currentUser.role || "").toLowerCase().replace(/\s/g, '');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    id: initialData.id,
                    nama_kegiatan: initialData.nama,
                    tanggal: initialData.raw_tanggal,
                    waktu_mulai: initialData.raw_waktu_mulai,
                    waktu_selesai: initialData.raw_waktu_selesai,
                    lokasi: initialData.lokasi,
                    deskripsi: initialData.deskripsi === "Tidak ada deskripsi." ? "" : initialData.deskripsi,
                    id_kelas: initialData.id_kelas || "" 
                });
            } else {
                setFormData({ nama_kegiatan: "", tanggal: "", waktu_mulai: "", waktu_selesai: "", lokasi: "", deskripsi: "", id_kelas: "" });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalData = { ...formData };
        if (userRole === 'pengurus' || userRole === 'admin') {
            finalData.id_kelas = null; 
        } else if (!finalData.id_kelas) {
            return showAlert("error", "Silakan pilih kelas terlebih dahulu.");
        }
        onSubmit(finalData);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <AlertToast message={message} onClose={clearAlert} />
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-lg">{initialData ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
                </div>
                <div className="p-5 overflow-y-auto">
                    <form id="form-kegiatan" onSubmit={handleSubmit} className="space-y-4">
                        {userRole === 'ustadz' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Skala Kegiatan (Kelas)</label>
                                <select required name="id_kelas" value={formData.id_kelas} onChange={(e) => setFormData({...formData, id_kelas: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white">
                                    <option value="" disabled>-- Pilih Kelas --</option>
                                    {myClasses.map((kls) => <option key={kls.id} value={kls.id}>{kls.kelas}</option>)}
                                </select>
                            </div>
                        )}
                        {(userRole === 'pengurus' || userRole === 'admin') && !initialData && (
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mb-2"><p className="text-xs text-blue-700 font-medium">Kegiatan ini otomatis akan berstatus <strong>GLOBAL</strong>.</p></div>
                        )}
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kegiatan</label><input required type="text" name="nama_kegiatan" value={formData.nama_kegiatan} onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label><input required type="date" name="tanggal" value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Mulai</label><input required type="time" name="waktu_mulai" value={formData.waktu_mulai} onChange={(e) => setFormData({...formData, waktu_mulai: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Selesai</label><input required type="time" name="waktu_selesai" value={formData.waktu_selesai} onChange={(e) => setFormData({...formData, waktu_selesai: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi</label><input required type="text" name="lokasi" value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label><textarea name="deskripsi" value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} rows="3" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="Opsional..."></textarea></div>
                    </form>
                </div>
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl">Batal</button>
                    <button type="submit" form="form-kegiatan" disabled={isSaving} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl flex items-center">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Simpan Kegiatan"}
                    </button>
                </div>
            </div>
        </div>
    );
}