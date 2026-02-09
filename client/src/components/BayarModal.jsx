import { useState, useRef } from "react";
import { X, UploadCloud, Loader2, FileText } from "lucide-react";

export default function BayarModal({
  isOpen,
  onClose,
  tagihan,
  onSubmit,
  saving,
  showAlert,
}) {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen || !tagihan) return null;

  const infoRekening = {
    no_rek: "7411188772",
    bank: "BCA",
    atas_nama: "Dianingtas Hartono Simajorang",
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        // Guna showAlert dari props
        showAlert("error", "Ukuran file maksimal 2MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      // Guna showAlert dari props
      showAlert("error", "Mohon unggah bukti pembayaran terlebih dahulu.");
      return;
    }
    onSubmit(tagihan.id, file);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 pb-0">
          <h3 className="text-xl font-bold text-gray-900">
            Tambah Data Pembayaran
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-blue-600/80 text-sm">Nominal</span>
              <span className="font-semibold text-gray-800">
                {tagihan.nominal}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-blue-600/80 text-sm">
                No. Rekening Pembayaran
              </span>
              <span className="font-semibold text-gray-800">
                {infoRekening.no_rek}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-blue-600/80 text-sm">
                Bank / Nama Penerima
              </span>
              <span className="font-semibold text-gray-800 text-right w-1/2">
                {infoRekening.bank} / {infoRekening.atas_nama}
              </span>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer flex flex-col items-center justify-center gap-3 group"
            onClick={() => fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, application/pdf"
              onChange={handleFileChange}
            />

            {file ? (
              <>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-green-600">Siap diunggah</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="text-xs text-red-500 hover:underline mt-2"
                >
                  Hapus / Ganti File
                </button>
              </>
            ) : (
              <>
                <div className="p-3 bg-gray-100 rounded-full text-gray-500 group-hover:scale-110 transition">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Unggah Bukti Pembayaran
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Klik atau seret file untuk mengunggah bukti pembayaran Anda.
                  </p>
                </div>
                <div className="mt-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                  Pilih File
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
          >
            Tutup
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !file}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:bg-blue-300 flex items-center justify-center"
          >
            {saving ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : null}
            {saving ? "Mengirim..." : "Kirim Data Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
