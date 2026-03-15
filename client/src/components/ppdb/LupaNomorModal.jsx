import React, { useState } from "react";
import api from "../../config/api";
import { X, Loader2, CheckCircle } from "lucide-react";

export default function LupaNomorModal({ isOpen, onClose, onUseNumber }) {
  const [form, setForm] = useState({ no_hp: "", tanggal_lahir: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.post("/ppdb/public/lupa-nomor", form);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Data tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ no_hp: "", tanggal_lahir: "" });
    setResult(null);
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-gray-800">Cari Nomor Pendaftaran</h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition">
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleSearch}>
            <p className="text-sm text-gray-500 mb-5">Masukkan Nomor HP (Santri/Wali) dan Tanggal Lahir calon santri yang digunakan saat pendaftaran.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">No. HP / WA</label>
                <input
                  type="text"
                  value={form.no_hp}
                  onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                  placeholder="0812345..."
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Tanggal Lahir Santri</label>
                <input
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {error && <p className="mb-4 text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Cari Data Saya"}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-lg font-bold text-gray-800">Data Ditemukan!</h4>
            <p className="text-sm text-gray-500 mt-1 mb-4">A.n {result.nama_lengkap}</p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl py-4 mb-6">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nomor Pendaftaran Anda</p>
              <p className="text-xl font-black font-mono text-green-700 tracking-widest">{result.no_pendaftaran}</p>
            </div>

            <button
              onClick={() => {
                onUseNumber(result.no_pendaftaran);
                handleClose();
              }}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition"
            >
              Gunakan Nomor & Cek Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}