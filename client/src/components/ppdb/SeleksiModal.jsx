import { useState, useEffect } from "react";
import api from "../../config/api";
import { X, BookOpen, PenTool, MessageSquare, Loader2 } from "lucide-react";

export default function SeleksiModal({ isOpen, data, onClose, onSuccess }) {
  if (!isOpen || !data) return null;

  const existing = data.ppdb_seleksi;
  const [form, setForm] = useState({
    nilai_quran: "", catatan_quran: "", juz_diuji: "",
    nilai_tulis: "", catatan_tulis: "",
    nilai_wawancara: "", catatan_wawancara: "",
    tanggal_seleksi: new Date().toISOString().split("T")[0],
    rekomendasi: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        nilai_quran: existing.nilai_quran ?? "", catatan_quran: existing.catatan_quran ?? "", juz_diuji: existing.juz_diuji ?? "",
        nilai_tulis: existing.nilai_tulis ?? "", catatan_tulis: existing.catatan_tulis ?? "",
        nilai_wawancara: existing.nilai_wawancara ?? "", catatan_wawancara: existing.catatan_wawancara ?? "",
        tanggal_seleksi: existing.tanggal_seleksi?.split("T")[0] || new Date().toISOString().split("T")[0],
        rekomendasi: existing.rekomendasi ?? "",
      });
    }
  }, [existing]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const nilaiTotal = (() => {
    const nq = parseFloat(form.nilai_quran) || 0;
    const nt = parseFloat(form.nilai_tulis) || 0;
    const nw = parseFloat(form.nilai_wawancara) || 0;
    return (nq * 0.4 + nt * 0.35 + nw * 0.25).toFixed(1);
  })();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.post(`/ppdb/panitia/seleksi/${data.id}`, form);
      onSuccess();
    } catch (err) {
      alert("Gagal menyimpan hasil seleksi");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Input Penilaian Seleksi</h3>
            <p className="text-xs font-bold font-mono text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block mt-1">{data.no_pendaftaran}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Nama Peserta</p><p className="text-gray-800 font-bold">{data.nama_lengkap}</p></div>
            <div><p className="text-xs font-bold text-gray-400 uppercase">Hafalan</p><p className="text-gray-800 font-bold">{data.juz_hafalan || 0} Juz</p></div>
          </div>

          <div className="border border-green-100 bg-green-50/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4 border-b border-green-100 pb-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><BookOpen size={20}/></div>
              <div><p className="font-bold text-green-800">Tes Al-Quran / Hafalan</p><p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Bobot: 40%</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Nilai (0–100)</label><input type="number" name="nilai_quran" value={form.nilai_quran} onChange={handleChange} className={inputCls} /></div>
              <div><label className={labelCls}>Juz Diuji</label><input type="number" name="juz_diuji" value={form.juz_diuji} onChange={handleChange} className={inputCls} /></div>
              <div className="col-span-2"><label className={labelCls}>Catatan Penilai</label><textarea name="catatan_quran" value={form.catatan_quran} onChange={handleChange} rows={2} className={`${inputCls} resize-none`} /></div>
            </div>
          </div>

          <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4 border-b border-blue-100 pb-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><PenTool size={20}/></div>
              <div><p className="font-bold text-blue-800">Tes Tulis Akademik</p><p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Bobot: 35%</p></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div><label className={labelCls}>Nilai (0–100)</label><input type="number" name="nilai_tulis" value={form.nilai_tulis} onChange={handleChange} className={inputCls} /></div>
            </div>
          </div>

          <div className="border border-purple-100 bg-purple-50/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4 border-b border-purple-100 pb-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
              <div><p className="font-bold text-purple-800">Wawancara</p><p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Bobot: 25%</p></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div><label className={labelCls}>Nilai (0–100)</label><input type="number" name="nilai_wawancara" value={form.nilai_wawancara} onChange={handleChange} className={inputCls} /></div>
            </div>
          </div>

          {/* Rekomendasi Akhir */}
          <div className="bg-gray-800 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-4">
              <p className="font-bold uppercase tracking-widest text-sm text-gray-300">Nilai Akhir</p>
              <p className={`text-4xl font-black ${parseFloat(nilaiTotal) >= 70 ? "text-green-400" : parseFloat(nilaiTotal) >= 50 ? "text-yellow-400" : "text-red-400"}`}>{nilaiTotal}</p>
            </div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Keputusan Panitia</label>
            <div className="flex gap-3">
              {["Diterima", "Pertimbangan", "Ditolak"].map((r) => (
                <button
                  key={r} type="button" onClick={() => setForm({...form, rekomendasi: r})}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition border-2 ${
                    form.rekomendasi === r
                      ? r === "Diterima" ? "bg-green-500 border-green-500 text-white" : r === "Ditolak" ? "bg-red-500 border-red-500 text-white" : "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin"/>} Simpan Penilaian
          </button>
        </div>
      </div>
    </div>
  );
}