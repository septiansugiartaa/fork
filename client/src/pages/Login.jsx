import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RegisterModal from "../components/RegisterModal"; // Pastikan path ini benar

export default function Login() {
    const [openRegister, setOpenRegister] = useState(false);
    // Menggunakan 'identifier' karena isinya bisa NIP atau No HP
    const [identifier, setIdentifier] = useState(""); 
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        if (!identifier.trim()) {
            setError("NIS atau Nomor HP harus diisi");
            setLoading(false);
            return;
        }
        
        if (!password.trim()) {
            setError("Kata sandi harus diisi");
            setLoading(false);
            return;
        }
        
        try {
            // Perhatikan payload sekarang mengirim 'identifier'
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                identifier, 
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const { token, user } = response.data;
            
            // Simpan token dan user data
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user || {}));
            }
            
            // Redirect berdasarkan role (Data role diambil dari backend)
            // Asumsi role standar: 'santri', 'admin', 'wali'
            if (user?.role === 'admin' || user?.role === 'pengurus') {
                navigate('/admin/dashboard');
            } else if (user?.role === 'wali' || user?.role === 'orangtua') {
                // Pastikan route dashboard wali sudah dibuat
                navigate('/santri'); // Atau '/wali/dashboard' jika sudah ada
            } else {
                // Default ke santri
                navigate('/santri');
            }
            
        } catch (err) {
            console.error('Login error:', err);
            
            if (err.response) {
                setError(err.response.data.message || 'Login gagal');
            } else if (err.request) {
                setError('Tidak dapat terhubung ke server');
            } else {
                setError('Terjadi kesalahan: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Bagian Kiri (Banner/Logo) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white flex-col justify-center items-center px-12">
                <div className="flex flex-col items-center text-center max-w-md">
                    <div className="w-28 h-28 rounded-2xl bg-white/20 flex items-center justify-center mb-8 shadow-inner border border-white/30">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="white">
                            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-3">SIM-Tren</h1>
                    <p className="text-lg font-medium mb-6 text-blue-50">Sistem Informasi Manajemen Pesantren</p>
                </div>
            </div>

            {/* Bagian Kanan (Form Login) */}
            <div className="flex w-full lg:w-1/2 justify-center items-center px-6 bg-white">
                <div className="w-full max-w-md">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
                    <p className="text-gray-500 mb-8">Silakan masuk menggunakan akun Anda</p>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center text-sm font-medium">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                NIS / Nomor HP
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Masukkan NIS atau No. HP Anda" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">
                                    Kata Sandi
                                </label>
                                <button 
                                    type="button"
                                    className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
                                    onClick={() => alert("Silakan hubungi administrator pondok untuk reset password.")}
                                >
                                    Lupa kata sandi?
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    placeholder="Masukkan Kata Sandi" 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Memproses...
                                </>
                            ) : "Masuk"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Belum punya akun?{" "}
                            <button 
                                onClick={() => setOpenRegister(true)} 
                                className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                disabled={loading}
                            >
                                Daftar Sekarang
                            </button>
                        </p>
                    </div>
                </div>

                <RegisterModal
                    open={openRegister}
                    onClose={() => setOpenRegister(false)}
                />
            </div>
        </div>
    );
}