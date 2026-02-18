import { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import axios from "axios";

const CreateMateriModal = ({ isOpen, onClose, refreshMateri, materiToEdit }) => {
  const [judul_materi, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [gambar,setGambar] = useState("")
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (isOpen) {
    if (materiToEdit) {
      setJudul(materiToEdit.judul || "");
      setPenulis(materiToEdit.penulis || "");
      setRingkasan(materiToEdit.ringkasan || "");
      setGambar(materiToEdit.gambar || "");
    } else {
      // reset kalau create baru
      setJudul("");
      setPenulis("");
      setRingkasan("");
      setGambar("");
    }
  }
}, [isOpen, materiToEdit]);
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (materiToEdit) {
        await axios.put(
        `http://localhost:3000/api/global/manageMateri/${materiToEdit.id}`,
        { judul_materi, penulis, ringkasan, gambar },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      } else { 
        await axios.post(
          "http://localhost:3000/api/global/manageMateri",
          { judul_materi, penulis, ringkasan, gambar},
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
              onChange={(e) => setJudul(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Penulis <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={penulis}
              onChange={(e) => setPenulis(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Ringkasan Materi <span className="text-red-600">*</span>
            </label>
            <textarea
              rows="5"
              value={ringkasan}
              onChange={(e) => setRingkasan(e.target.value)}
              required
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black ">
                Gambar <span className="text-gray-400">(kosongkan jika tidak ada)</span>
            </label>
            <input
              type="text"
              value={gambar}
              onChange={(e) => setGambar(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
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