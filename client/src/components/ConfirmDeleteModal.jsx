import { X, Trash2 } from "lucide-react";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Konfirmasi Hapus
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus data ini?
        </p>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="w-1/4 py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-sm gap-2 active:scale-95 hover:bg-green-100 transition duration-200 cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-1/4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 hover:bg-red-500 hover:text-white transition duration-200 cursor-pointer"
          >
            <Trash2 size={16}/> {loading ? "Loading.." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;