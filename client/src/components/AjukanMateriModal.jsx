import { useState, useEffect, useContext } from "react";
import { X, Send } from "lucide-react";
import api from "../config/api";
import RichTextEditor from "./RichTextEditor";
import { AuthContext } from "../context/AuthContext";

const AjukanMateriModal = ({ isOpen, onClose, onSuccess, showRiwayatInfo = true }) => {
  const [judul_materi, setJudul]       = useState("");
  const [penulis, setPenulis]           = useState("");
  const [ringkasan, setRingkasan]       = useState("");
  const [isi_materi, setIsiMateri]      = useState("");
  const [gambar, setGambar]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});
  const { user } = useContext(AuthContext);
  const isAuthenticatedUser = Boolean(user?.id && user?.role);

  // Reset form setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setJudul("");
      setPenulis(isAuthenticatedUser ? (user?.nama || "") : "");
      setRingkasan("");
      setIsiMateri("");
      setGambar(null);
      setErrors({});
    }
  }, [isOpen, isAuthenticatedUser, user]);

  const validate = () => {
    const e = {};
    if (!judul_materi.trim()) e.judul_materi = "Judul materi wajib diisi.";
    if (!penulis.trim())       e.penulis      = "Nama penulis wajib diisi.";
    if (!ringkasan.trim())     e.ringkasan    = "Ringkasan wajib diisi.";
    const textOnly = isi_materi ? isi_materi.replace(/<(.|\\n)*?>/g, "").trim() : "";
    if (!textOnly)             e.isi_materi   = "Isi materi wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("judul_materi", judul_materi);
      formData.append("penulis",      penulis);
      formData.append("ringkasan",    ringkasan);
      formData.append("isi_materi",   isi_materi);
      if (gambar instanceof File) formData.append("gambar", gambar);

      await api.post("/public/pengajuanMateri", formData);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("AjukanMateriModal submit:", err);
      setErrors({ submit: err.response?.data?.message || "Gagal mengirim pengajuan. Coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputBase =
    "mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-green-200";
  const inputClass = (field) =>
    `${inputBase} ${errors[field] ? "border-red-400 focus:ring-red-100" : "border-gray-200"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Ajukan Materi Pengalaman
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Bagikan pengalamanmu tentang scabies untuk ditinjau tim kesehatan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-84px)] space-y-5"
        >
          {errors.submit && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Judul */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Judul Materi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={judul_materi}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Pengalaman Saya Mengatasi Scabies Selama 2 Minggu"
                className={inputClass("judul_materi")}
              />
              {errors.judul_materi && (
                <p className="text-xs text-red-500 mt-1">{errors.judul_materi}</p>
              )}
            </div>

            {/* Penulis */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Nama Penulis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={penulis}
                onChange={(e) => setPenulis(e.target.value)}
                placeholder="Nama Anda"
                readOnly={isAuthenticatedUser}
                className={`${inputClass("penulis")} ${isAuthenticatedUser ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
              />
              {errors.penulis && (
                <p className="text-xs text-red-500 mt-1">{errors.penulis}</p>
              )}
            </div>

            {/* Gambar */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Gambar <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGambar(e.target.files[0])}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700
                           file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-1.5
                           file:text-green-700 file:font-medium hover:file:bg-green-100 transition"
              />
            </div>

            {/* Ringkasan */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Ringkasan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Tuliskan ringkasan singkat pengalaman Anda..."
                className={inputClass("ringkasan")}
              />
              {errors.ringkasan && (
                <p className="text-xs text-red-500 mt-1">{errors.ringkasan}</p>
              )}
            </div>

            {/* Isi Materi */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Isi Materi <span className="text-red-500">*</span>
              </label>
              <div
                className={`mt-1 overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-green-200
                  ${errors.isi_materi ? "border-red-400" : "border-gray-200"}`}
              >
                <RichTextEditor
                  value={isi_materi}
                  onChange={setIsiMateri}
                  className="bg-white rounded-xl"
                  placeholder="Ceritakan pengalaman Anda secara detail..."
                />
              </div>
              {errors.isi_materi && (
                <p className="text-xs text-red-500 mt-1">{errors.isi_materi}</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            <strong>Catatan:</strong> Materi yang Anda ajukan akan ditinjau oleh Tim Kesehatan sebelum
            diterbitkan.
            {showRiwayatInfo && " Anda dapat memantau status pengajuan melalui tombol \"Riwayat Pengajuan\"."}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700
                         disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim Pengajuan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjukanMateriModal;
