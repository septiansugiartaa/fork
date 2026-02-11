import { useState } from 'react';
import axios from 'axios';

export default function RegisterModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      setLoading(false);
      return;
    }

    if (!formData.nip || !formData.nama || !formData.password) {
      setError('Semua field harus diisi');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        nip: formData.nip,
        nama: formData.nama,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess('Registrasi berhasil! Silakan login.');
      
      setTimeout(() => {
        setFormData({
          nip: '',
          nama: '',
          password: '',
          confirmPassword: ''
        });
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Terjadi kesalahan saat registrasi');
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
      } else {
        setError('Terjadi kesalahan: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-600 to-blue-500 lg:bg-black/60 lg:backdrop-blur-sm lg:from-transparent lg:to-transparent transition-all duration-300">
      <div className="absolute inset-0 hidden lg:block" onClick={onClose} />

      {/* CARD MODAL */}
      <div className="relative w-full max-w-2xl rounded-3xl shadow-lg p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-200 bg-white/10 backdrop-blur-md border border-white/20 lg:bg-white lg:border-none lg:backdrop-blur-none">
        <button onClick={onClose} className="absolute top-4 right-4 lg:top-6 lg:right-6 text-2xl cursor-pointer transition-colors text-white/70 hover:text-white lg:text-gray-400 lg:hover:text-gray-600" disabled={loading}>
          ✕
        </button>

        {/* Judul */}
        <h2 className="text-2xl lg:text-3xl font-bold text-center mb-8 text-white lg:text-gray-800">
            Buat Akun Baru
        </h2>

        {/* Notifikasi Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center text-sm font-medium bg-red-500/20 border border-red-500/30 text-white lg:bg-red-50 lg:border-red-200 lg:text-red-600">
            {error}
          </div>
        )}

        {/* Notifikasi Success */}
        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-center text-sm font-medium bg-green-500/20 border border-green-500/30 text-white lg:bg-green-50 lg:border-green-200 lg:text-green-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            
            {/* Input NIS */}
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-blue-100 lg:text-gray-700">NIS</label>
              <input 
                type="text" 
                name="nip" 
                placeholder="Masukkan NIS" 
                className="w-full px-4 py-3 rounded-xl outline-none transition-all shadow-sm bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 lg:bg-white lg:border-gray-300 lg:text-gray-900 lg:placeholder-gray-400 lg:focus:ring-blue-500 lg:focus:border-blue-500"
                value={formData.nip}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Input Nama */}
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-blue-100 lg:text-gray-700">Nama</label>
              <input 
                type="text" 
                name="nama" 
                placeholder="Masukkan Nama Lengkap" 
                className="w-full px-4 py-3 rounded-xl outline-none transition-all shadow-sm bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 lg:bg-white lg:border-gray-300 lg:text-gray-900 lg:placeholder-gray-400 lg:focus:ring-blue-500 lg:focus:border-blue-500"
                value={formData.nama}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-blue-100 lg:text-gray-700">Kata Sandi</label>
              <input 
                type="password" 
                name="password" 
                placeholder="Masukkan Kata Sandi" 
                className="w-full px-4 py-3 rounded-xl outline-none transition-all shadow-sm bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 lg:bg-white lg:border-gray-300 lg:text-gray-900 lg:placeholder-gray-400 lg:focus:ring-blue-500 lg:focus:border-blue-500"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Input Confirm Password */}
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 text-blue-100 lg:text-gray-700">Konfirmasi Kata Sandi</label>
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="Ulangi Kata Sandi" 
                className="w-full px-4 py-3 rounded-xl outline-none transition-all shadow-sm bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/50 lg:bg-white lg:border-gray-300 lg:text-gray-900 lg:placeholder-gray-400 lg:focus:ring-blue-500 lg:focus:border-blue-500"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

          </div>

          {/* Button Submit */}
          <button 
            type="submit" 
            className="w-full mt-8 py-3.5 rounded-xl font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-lg hover:shadow-xl bg-white text-blue-600 hover:bg-blue-50 lg:bg-blue-600 lg:text-white lg:hover:bg-blue-700 lg:hover:shadow-blue-500/30"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : 'Daftar Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}