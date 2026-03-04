import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X } from "lucide-react";
import api from "../config/api";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="p-6 flex justify-between items-center border-b"><h2 className="text-xl font-bold text-gray-800">{materiToEdit ? "Edit Materi" : "Tambah Materi"}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={22} /></button></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div><label className="text-sm font-medium text-gray-600">Judul Materi *</label><input type="text" value={judul_materi} onChange={(e) => setJudul(e.target.value)} className={`w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.judul_materi ? "border-red-500" : "focus:ring-2 focus:ring-green-500"}`} /></div>
            <div><label className="text-sm font-medium text-gray-600">Ringkasan *</label><textarea rows="3" value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} className={`w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.ringkasan ? "border-red-500" : "focus:ring-2 focus:ring-green-500"}`} /></div>
            <div><label className="text-sm font-medium text-gray-600">Isi Materi *</label><div className={`mt-2 rounded-xl border ${errors.isi_materi ? "border-red-500" : "focus-within:ring-2 focus-within:ring-green-500"}`}><ReactQuill theme="snow" value={isi_materi} onChange={setIsiMateri} className="bg-white rounded-xl" /></div></div>
            <div><label className="text-sm font-medium text-gray-600">Penulis *</label><input type="text" value={penulis} onChange={(e) => setPenulis(e.target.value)} className={`w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.penulis ? "border-red-500" : "focus:ring-2 focus:ring-green-500"}`} /></div>
            <div><label className="text-sm font-medium text-gray-600">Gambar</label><input type="file" accept="image/*" onChange={(e) => setGambar(e.target.files[0])} className="w-full mt-1 px-4 py-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="py-2.5 px-5 bg-green-50 text-green-600 rounded-xl">Batal</button><button type="submit" disabled={loading} className="px-5 py-2 font-semibold rounded-xl text-white bg-green-600">{loading ? "Simpan..." : "Simpan"}</button></div>
          </form>
      </div>
    </div>
  );
};

export default CreateMateriModal;