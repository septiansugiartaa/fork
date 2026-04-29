import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, CheckCircle, XCircle, Edit2, Loader2 } from "lucide-react";
import api from "../config/api";

const ReviewPengajuanModal = ({ isOpen, pengajuan, onClose, onUpdate }) => {
  const [judul_materi, setJudul]       = useState("");
  const [penulis, setPenulis]           = useState("");
  const [ringkasan, setRingkasan]       = useState("");
  const [isi_materi, setIsiMateri]      = useState("");
  const [gambar, setGambar]             = useState(null);
  const [catatan_timkes, setCatatan]    = useState("");
  const [isEditing, setIsEditing]       = useState(false);
  const [loadingSetujui, setLoadingSetujui] = useState(false);
  const [loadingTolak, setLoadingTolak]     = useState(false);
  const [loadingEdit, setLoadingEdit]       = useState(false);
  const [error, setError]               = useState("");

  const isReadOnly = pengajuan?.status !== "ditinjau";

  useEffect(() => {
    if (isOpen && pengajuan) {
      setJudul(pengajuan.judul || "");
      setPenulis(pengajuan.penulis || "");
      setRingkasan(pengajuan.ringkasan || "");
      setIsiMateri(pengajuan.isi_materi || "");
      setCatatan(pengajuan.catatan_timkes || "");
      setGambar(null);
      setIsEditing(false);
      setError("");
    }
  }, [isOpen, pengajuan]);

  if (!isOpen || !pengajuan) return null;

  // ── Simpan edit (tanpa proses) ────────────────────────────
  const handleSaveEdit = async () => {
    setLoadingEdit(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("judul_materi", judul_materi);
      formData.append("penulis",      penulis);
      formData.append("ringkasan",    ringkasan);
      formData.append("isi_materi",   isi_materi);
      if (catatan_timkes) formData.append("catatan_timkes", catatan_timkes);
      if (gambar instanceof File)     formData.append("gambar", gambar);

      await api.put(`/timkesehatan/pengajuanMateri/${pengajuan.id}`, formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setLoadingEdit(false);
    }
  };

  // ── Setujui ───────────────────────────────────────────────
  const handleSetujui = async () => {
    setLoadingSetujui(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("judul_materi", judul_materi);
      formData.append("penulis",      penulis);
      formData.append("ringkasan",    ringkasan);
      formData.append("isi_materi",   isi_materi);
      if (catatan_timkes) formData.append("catatan_timkes", catatan_timkes);
      if (gambar instanceof File)     formData.append("gambar", gambar);

      await api.post(`/timkesehatan/pengajuanMateri/${pengajuan.id}/setujui`, formData);
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menyetujui pengajuan.");
    } finally {
      setLoadingSetujui(false);
    }
  };

  // ── Tolak ─────────────────────────────────────────────────
  const handleTolak = async () => {
    setLoadingTolak(true);
    setError("");
    try {
      await api.post(`/timkesehatan/pengajuanMateri/${pengajuan.id}/tolak`, {
        catatan_timkes,
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menolak pengajuan.");
    } finally {
      setLoadingTolak(false);
    }
  };

  const inputBase =
    "mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-green-200";
  const inputClass = (editable = true) =>
    `${inputBase} ${!editable || isReadOnly ? "bg-gray-50 border-gray-100 text-gray-500 cursor-default" : "border-gray-200"}`;

  const STATUS_HEADER = {
    ditinjau:  { text: "Tinjau Pengajuan",     cls: "text-amber-600" },
    disetujui: { text: "Pengajuan Disetujui",  cls: "text-green-600" },
    ditolak:   { text: "Pengajuan Ditolak",    cls: "text-red-600"   },
  };
  const hdr = STATUS_HEADER[pengajuan.status] || STATUS_HEADER.ditinjau;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className={`text-lg sm:text-xl font-bold ${hdr.cls}`}>{hdr.text}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Diajukan oleh: <strong>{pengajuan.penulis}</strong>
              {" · "}
              {new Date(pengajuan.tanggal_pengajuan).toLocaleDateString("id-ID", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <Edit2 size={13} />
                Edit Isi
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-84px)] space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Judul */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Judul Materi</label>
              <input
                type="text"
                value={judul_materi}
                onChange={(e) => isEditing && setJudul(e.target.value)}
                readOnly={!isEditing || isReadOnly}
                className={inputClass(isEditing)}
              />
            </div>

            {/* Penulis */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Penulis</label>
              <input
                type="text"
                value={penulis}
                onChange={(e) => isEditing && setPenulis(e.target.value)}
                readOnly={!isEditing || isReadOnly}
                className={inputClass(isEditing)}
              />
            </div>

            {/* Gambar upload (hanya saat edit) */}
            {isEditing && !isReadOnly && (
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Gambar <span className="text-gray-400 font-normal">(opsional, ganti gambar lama)</span>
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
            )}

            {/* Gambar preview (read-only) */}
            {!isEditing && pengajuan.gambar && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Gambar</label>
                <img
                  src={`/uploads/${pengajuan.gambar}`}
                  alt="gambar materi"
                  className="mt-1 w-full h-40 object-cover rounded-xl border border-gray-100"
                />
              </div>
            )}

            {/* Ringkasan */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Ringkasan</label>
              <textarea
                rows="3"
                value={ringkasan}
                onChange={(e) => isEditing && setRingkasan(e.target.value)}
                readOnly={!isEditing || isReadOnly}
                className={inputClass(isEditing)}
              />
            </div>

            {/* Isi Materi */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Isi Materi</label>
              {isEditing && !isReadOnly ? (
                <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-green-200">
                  <ReactQuill
                    theme="snow"
                    value={isi_materi}
                    onChange={setIsiMateri}
                    className="bg-white rounded-xl"
                  />
                </div>
              ) : (
                <div
                  className="mt-1 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: isi_materi }}
                />
              )}
            </div>

            {/* Catatan Timkes */}
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Catatan{" "}
                {!isReadOnly && (
                  <span className="text-gray-400 font-normal">(opsional, untuk penolakan/persetujuan)</span>
                )}
              </label>
              <textarea
                rows="2"
                value={catatan_timkes}
                onChange={(e) => setCatatan(e.target.value)}
                readOnly={isReadOnly}
                placeholder={isReadOnly ? "-" : "Tulis catatan..."}
                className={inputClass(!isReadOnly)}
              />
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────── */}
          <div className="pt-3 border-t border-gray-100">
            {isReadOnly ? (
              /* Sudah diproses — hanya close */
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition"
                >
                  Tutup
                </button>
              </div>
            ) : isEditing ? (
              /* Mode edit — simpan atau batal edit */
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition"
                >
                  Batal Edit
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={loadingEdit}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700
                             disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 justify-center"
                >
                  {loadingEdit ? (
                    <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            ) : (
              /* Mode review — setujui / tolak */
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTolak}
                    disabled={loadingTolak || loadingSetujui}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-red-600 bg-red-50 border border-red-200
                               hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed
                               transition flex items-center gap-2 justify-center"
                  >
                    {loadingTolak ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={handleSetujui}
                    disabled={loadingSetujui || loadingTolak}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-semibold text-white bg-green-600
                               hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                               transition flex items-center gap-2 justify-center"
                  >
                    {loadingSetujui ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Setujui & Terbitkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPengajuanModal;
