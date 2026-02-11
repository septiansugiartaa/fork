import { useState } from "react";
import { Lock, X, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function PasswordModal({ isOpen, onClose, onSubmit, saving }) {
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" }); // Alert State

  if (!isOpen) return null;

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordBaru.length < 6) {
      showAlert("error", "Password minimal 6 karakter");
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      showAlert("error", "Konfirmasi password tidak cocok!");
      return;
    }
    // Kirim password bersih ke parent
    onSubmit(passwordBaru);
    // Reset form
    setPasswordBaru("");
    setKonfirmasiPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
        
        {/* Alert Component */}
        {message.text && (
            <div className={`absolute top-4 left-4 right-4 z-[60] p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                <div className={`flex-shrink-0 p-1 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                </div>
                <p className="text-xs font-medium flex-1">{message.text}</p>
                <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
        )}

        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center">
            <Lock className="mr-2 text-blue-600" size={20} /> Ganti Kata Sandi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Kata Sandi
            </label>
            <input
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300 flex justify-center items-center"
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : null}
              {saving ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}