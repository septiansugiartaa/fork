import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

export default function CreateKegiatanModal({ isOpen, onClose, onSubmit, isSaving, initialData }) {
    const [formData, setFormData] = useState({
        nama_kegiatan: "",
        tanggal: "",
        waktu_mulai: "",
        waktu_selesai: "",
        lokasi: "",
        deskripsi: ""
    });

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
                    deskripsi: initialData.deskripsi === "Tidak ada deskripsi." ? "" : initialData.deskripsi
                });
            } else {
                setFormData({
                    nama_kegiatan: "",
                    tanggal: "",
                    waktu_mulai: "",
                    waktu_selesai: "",
                    lokasi: "",
                    deskripsi: ""
                });
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isEditMode = !!initialData;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800 text-lg">
                        {isEditMode ? "Edit Kegiatan" : "Tambah Kegiatan Baru"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto">
                    <form id="form-kegiatan" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kegiatan</label>
                            <input required type="text" name="nama_kegiatan" value={formData.nama_kegiatan} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: Kajian Kitab Kuning" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                            <input required type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Mulai</label>
                                <input required type="time" name="waktu_mulai" value={formData.waktu_mulai} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Selesai</label>
                                <input required type="time" name="waktu_selesai" value={formData.waktu_selesai} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi</label>
                            <input required type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: Masjid Utama / Aula" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi & Catatan</label>
                            <textarea required name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} rows="3" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="Tuliskan detail kegiatan di sini..."></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition">Batal</button>
                    <button type="submit" form="form-kegiatan" disabled={isSaving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center disabled:opacity-70">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Simpan Kegiatan"}
                    </button>
                </div>
            </div>
        </div>
    );
}