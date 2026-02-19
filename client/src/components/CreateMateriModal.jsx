import { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import axios from "axios";

const CreateMateriModal = ({ isOpen, onClose, refreshMateri, materiToEdit }) => {
  const [judul_materi, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [gambar,setGambar] = useState(null) 
  const [gambarError, setGambarError] = useState("");
  const [loading, setLoading] = useState(false);
  const [
    errors, setErrors
  ] = useState({
        judul_materi: "",
        penulis: "",
        ringkasan: ""
      });

  const validateForm = () => {
    let newErrors = {
      judul_materi: "",
      penulis: "",
      ringkasan: ""
    };

    let isValid = true;

    if (!judul_materi.trim()) {
      newErrors.judul_materi = "Judul materi wajib diisi";
      isValid = false;
    }

    if (!penulis.trim()) {
      newErrors.penulis = "Penulis wajib diisi";
      isValid = false;
    }

    if (!ringkasan.trim()) {
      newErrors.ringkasan = "Ringkasan wajib diisi";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    if (isOpen) {
      if (materiToEdit) {
        setJudul(materiToEdit.judul || "");
        setPenulis(materiToEdit.penulis || "");
        setRingkasan(materiToEdit.ringkasan || "");
        setGambar(null);
        setGambarError("");
      } else {
        // reset kalau create baru
        setJudul("");
        setPenulis("");
        setRingkasan("");
        setGambar(null);
        setGambarError("");;
      }
        setErrors({
        judul_materi: "",
        penulis: "",
        ringkasan: ""
      });

    setGambar(null);
    setGambarError("");
    }
  }, [isOpen, materiToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm() || gambarError) return;
  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("judul_materi", judul_materi);
    formData.append("penulis", penulis);
    formData.append("ringkasan", ringkasan);

    if (gambar instanceof File) {
      formData.append("gambar", gambar);
    }

    if (materiToEdit) {
      await axios.put(
        `http://localhost:3000/api/global/manageMateri/${materiToEdit.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        }
      );
    } else {
      await axios.post(
        "http://localhost:3000/api/global/manageMateri",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        }
      );
    }

    refreshMateri();
    onClose();

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-6 -mb-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {materiToEdit ? "Edit Materi" : "Tambah Materi"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="text-sm font-medium text-gray-600">
              Judul Materi <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={judul_materi}
              onChange={(e) => {
                setJudul(e.target.value); 
                setErrors(prev => ({ ...prev, judul_materi: "" }));
              }}
              
              className={
                `w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.judul_materi ? "border-red-500 focus:ring-red-500" : "focus:ring-2 focus:ring-blue-500"}`
              }
            />
            {errors.judul_materi && (
              <p className="text-sm text-red-600 mt-1">
                {errors.judul_materi}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Penulis <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={penulis}
              onChange={(e) => {
                setPenulis(e.target.value);
                setErrors(prev => ({ ...prev, penulis: "" }));
              }}
              
              className={
                `w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.penulis ? "border-red-500 focus:ring-red-500" : "focus:ring-2 focus:ring-blue-500"}`
              }
            />
            {errors.penulis && (
              <p className="text-sm text-red-600 mt-1">
                {errors.penulis}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Ringkasan Materi <span className="text-red-600">*</span>
            </label>
            <textarea
              rows="5"
              value={ringkasan}
              onChange={(e) => {
                setRingkasan(e.target.value);
                setErrors(prev => ({ ...prev, ringkasan: "" }));
              }}
              
              className={
                `w-full mt-1 px-4 py-2 border rounded-xl outline-none ${errors.ringkasan ? "border-red-500 focus:ring-red-500" : "focus:ring-2 focus:ring-blue-500"}`
              }
            />
            {errors.ringkasan && (
              <p className="text-sm text-red-600 mt-1">
                {errors.ringkasan}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 ">
                Gambar <span className="text-gray-400">(kosongkan jika tidak ada)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setGambarError(""); // reset error dulu
                if (!file) return;

                const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

                if (!allowedTypes.includes(file.type)) {
                  setGambar(null);
                  setGambarError("Format harus jpg, jpeg, png, atau webp");
                  return;
                }

                if (file.size > 2 * 1024 * 1024) {
                  setGambar(null);
                  setGambarError("Ukuran maksimal 2MB");
                  return;
                }

                setGambar(file);
              }}
              className={
                `w-full mt-1 px-4 py-2 border rounded-xl outline-none ${gambarError ? "border-red-500 focus:ring-red-500" : "focus:ring-2 focus:ring-blue-500"}`
              }
            />
            {gambarError && (
              <p className="text-sm text-red-600 mt-1">
                {gambarError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className={
                `px-5 py-2 rounded-xl text-white transition
                  ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMateriModal;