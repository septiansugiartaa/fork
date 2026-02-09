import { useState } from "react";
import { Lock, X, Loader2 } from "lucide-react";

export default function PasswordModal({ isOpen, onClose, onSubmit, saving }) {
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordBaru.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      alert("Konfirmasi password tidak cocok!");
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
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
