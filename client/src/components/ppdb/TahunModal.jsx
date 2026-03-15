import { useState, useEffect } from "react";
import api from "../../config/api";
import { X, Loader2 } from "lucide-react";

export default function TahunModal({ isOpen, editData, onClose, onSuccess }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    nama_gelombang: "", tahun_ajaran: "", gelombang: "1",
    tanggal_buka: "", tanggal_tutup: "", tanggal_pengumuman: "",
    kuota: "", biaya_pendaftaran: "0", deskripsi: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (editData) {
            setForm({
                nama_gelombang: editData.nama_gelombang || "", tahun_ajaran: editData.tahun_ajaran || "",
                gelombang: String(editData.gelombang || 1), tanggal_buka: editData.tanggal_buka?.split("T")[0] || "",
                tanggal_tutup: editData.tanggal_tutup?.split("T")[0] || "", tanggal_pengumuman: editData.tanggal_pengumuman?.split("T")[0] || "",
                kuota: editData.kuota ? String(editData.kuota) : "", biaya_pendaftaran: String(editData.biaya_pendaftaran || 0),
                deskripsi: editData.deskripsi || "",
            });
        } else {
            setForm({ nama_gelombang: "", tahun_ajaran: "", gelombang: "1", tanggal_buka: "", tanggal_tutup: "", tanggal_pengumuman: "", kuota: "", biaya_pendaftaran: "0", deskripsi: "" });
        }
    }
  }, [isOpen, editData]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (isEdit) await api.put(`/ppdb/admin/tahun/${editData.id}`, form);
      else await api.post("/ppdb/admin/tahun", form);
      onSuccess("Data gelombang berhasil disimpan!");
    } catch (err) {
      alert(err.response?.data?.message || "Terjadi kesalahan"); // Di-handle fallback karena modal akan tertutup jika toast di parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto [scrollbar-width:none]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-800">{isEdit ? "Edit Gelombang" : "Tambah Gelombang Baru"}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Nama Gelombang *</label><input name="nama_gelombang" value={form.nama_gelombang} onChange={e => setForm({...form, nama_gelombang: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tahun Ajaran *</label><input name="tahun_ajaran" value={form.tahun_ajaran} onChange={e => setForm({...form, tahun_ajaran: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Gelombang Ke-</label><input type="number" name="gelombang" value={form.gelombang} onChange={e => setForm({...form, gelombang: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tgl Buka *</label><input type="date" name="tanggal_buka" value={form.tanggal_buka} onChange={e => setForm({...form, tanggal_buka: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tgl Tutup *</label><input type="date" name="tanggal_tutup" value={form.tanggal_tutup} onChange={e => setForm({...form, tanggal_tutup: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tgl Pengumuman</label><input type="date" name="tanggal_pengumuman" value={form.tanggal_pengumuman} onChange={e => setForm({...form, tanggal_pengumuman: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Kuota</label><input type="number" name="kuota" value={form.kuota} onChange={e => setForm({...form, kuota: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Tak terbatas"/></div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Biaya (Rp)</label><input type="number" name="biaya_pendaftaran" value={form.biaya_pendaftaran} onChange={e => setForm({...form, biaya_pendaftaran: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100 transition">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin"/>} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}