import { X, AlertTriangle } from "lucide-react";

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, loading, title = "Konfirmasi Aksi", message, confirmText = "Ya, Lanjutkan", confirmClass = "bg-blue-600 hover:bg-blue-700" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-yellow-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-5 py-2.5 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50 ${confirmClass}`}>
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
