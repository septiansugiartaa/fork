import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../config/api";
import RichTextEditor from "./RichTextEditor";

const CreateMateriModal = ({ isOpen, onClose, refreshMateri, materiToEdit }) => {
  const [judul_materi, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [isi_materi, setIsiMateri] = useState("");
  const [gambar, setGambar] = useState(null);
  const [gambarError, setGambarError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ judul_materi: "", penulis: "", ringkasan: "", isi_materi: "" });

  const validateForm = () => {
    let newErrors = { judul_materi: "", penulis: "", ringkasan: "", isi_materi: "" };
    let isValid = true;
    if (!judul_materi.trim()) { newErrors.judul_materi = "Judul materi wajib diisi"; isValid = false; }
    if (!penulis.trim()) { newErrors.penulis = "Penulis wajib diisi"; isValid = false; }
    if (!ringkasan.trim()) { newErrors.ringkasan = "Ringkasan wajib diisi"; isValid = false; }
    const textOnly = isi_materi ? isi_materi.replace(/<(.|\n)*?>/g, "").trim() : "";
    if (!textOnly) { newErrors.isi_materi = "Isi materi wajib diisi"; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (isOpen) {
      if (materiToEdit) {
        setJudul(materiToEdit.judul || ""); setPenulis(materiToEdit.penulis || ""); setRingkasan(materiToEdit.ringkasan || ""); setIsiMateri(materiToEdit.isi_materi || "");
      } else {
        setJudul(""); setPenulis(""); setRingkasan(""); setIsiMateri("");
      }
      setGambar(null); setGambarError("");
      setErrors({ judul_materi: "", penulis: "", ringkasan: "", isi_materi: "" });
    }
  }, [isOpen, materiToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || gambarError) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("judul_materi", judul_materi); formData.append("penulis", penulis); formData.append("ringkasan", ringkasan); formData.append("isi_materi", isi_materi);
      if (gambar instanceof File) formData.append("gambar", gambar);
      
      if (materiToEdit) await api.put(`/global/manageMateri/${materiToEdit.id}`, formData);
      else await api.post("/global/manageMateri", formData);
      
      refreshMateri(); onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const inputBaseClass =
    "mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-green-200";

  const getInputClass = (hasError) =>
    `${inputBaseClass} ${hasError ? "border-red-500 focus:ring-red-100" : "border-gray-200"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{materiToEdit ? "Edit Materi" : "Tambah Materi"}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Lengkapi form berikut untuk menyimpan materi.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-84px)] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Judul Materi <span className="text-red-500">*</span></label>
              <input type="text" value={judul_materi} onChange={(e) => setJudul(e.target.value)} className={getInputClass(errors.judul_materi)} />
              {errors.judul_materi && <p className="text-xs text-red-500 mt-1">{errors.judul_materi}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Penulis <span className="text-red-500">*</span></label>
              <input type="text" value={penulis} onChange={(e) => setPenulis(e.target.value)} className={getInputClass(errors.penulis)} />
              {errors.penulis && <p className="text-xs text-red-500 mt-1">{errors.penulis}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Gambar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGambar(e.target.files[0])}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-green-700 file:font-medium hover:file:bg-green-100 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Ringkasan <span className="text-red-500">*</span></label>
              <textarea rows="3" value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} className={getInputClass(errors.ringkasan)} />
              {errors.ringkasan && <p className="text-xs text-red-500 mt-1">{errors.ringkasan}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Isi Materi <span className="text-red-500">*</span></label>
              <div className={`mt-1 overflow-hidden rounded-xl border ${errors.isi_materi ? "border-red-500" : "border-gray-200"} focus-within:ring-2 focus-within:ring-green-200`}>
                <RichTextEditor value={isi_materi} onChange={setIsiMateri} className="bg-white rounded-xl" />
              </div>
              {errors.isi_materi && <p className="text-xs text-red-500 mt-1">{errors.isi_materi}</p>}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMateriModal;
