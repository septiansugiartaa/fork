import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RegisterModal from "../components/RegisterModal";

export default function Login() {
    const [openRegister, setOpenRegister] = useState(false);
    const [identifier, setIdentifier] = useState(""); 
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const navigate = useNavigate();

    // --- HELPER UNTUK AMBIL ROLE AMAN ---
    const getRoleSafe = (user) => {
        if (!user) return null;
        if (typeof user.role === 'string') return user.role.toLowerCase();
        if (user.user_role && Array.isArray(user.user_role)) {
            return user.user_role[0]?.role?.role?.toLowerCase();
        }
        return null;
    };

    // --- SESSION CHECK ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                const role = getRoleSafe(user);

                if (role === 'santri') navigate('/santri', { replace: true });
                else if (role === 'orangtua') navigate('/orangtua', { replace: true });
                else if (role === 'pengurus') navigate('/pengurus', { replace: true });
                else if (role === 'pimpinan') navigate('/pimpinan', { replace: true });
                else if (role === 'ustadz') navigate('/ustadz', { replace: true });
                else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (role === 'timkes') navigate('/timkesehatan', { replace: true });
                
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

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
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                identifier, 
                password
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            const { token, user } = response.data;
            
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user || {}));
            }
            
            const role = getRoleSafe(user);

            if (role === 'santri') navigate('/santri');
            else if (role === 'orangtua') navigate('/orangtua');
            else if (role === 'pengurus') navigate('/pengurus');
            else if (role === 'pimpinan') navigate('/pimpinan');
            else if (role === 'ustadz') navigate('/ustadz');
            else if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'timkes') navigate('/timkesehatan');            
            else navigate('/santri');
            
        } catch (err) {
            console.error('Login error:', err);
            if (err.response) setError(err.response.data.message || 'Login gagal');
            else if (err.request) setError('Tidak dapat terhubung ke server');
            else setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Wrapper Utama: Di Mobile jadi background biru gradient, di Desktop Row biasa
        <div className="min-h-screen flex bg-gradient-to-br from-blue-600 to-blue-500 lg:bg-none">
            
            {/* --- KOLOM KIRI (DESKTOP) --- */}
            {/* Hanya muncul di layar besar (lg:flex), isinya Banner Biru */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-blue-500 text-white flex-col justify-center items-center px-12 relative overflow-hidden">
                {/* Hiasan Background Circle (Opsional) */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center text-center max-w-md relative z-10">
                    <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-inner border border-white/30 ring-4 ring-white/10">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="white">
                            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 tracking-tight">SIM-Tren</h1>
                    <p className="text-lg font-medium mb-6 text-blue-100">Sistem Informasi Manajemen Pesantren</p>
                </div>
            </div>

            {/* --- KOLOM KANAN (FORM LOGIN) --- */}
            {/* Di Mobile: Full Width, Center, Padding */}
            <div className="flex w-full lg:w-1/2 justify-center items-center px-4 sm:px-6 lg:bg-white">
                
                {/* --- CARD LOGIN --- */}
                {/* Mobile: Glassmorphism (bg-white/10 + backdrop-blur) */}
                {/* Desktop: Polos (bg-transparent / shadow-none) */}
                <div className="w-full max-w-lg bg-white/20 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none p-8 rounded-3xl shadow-lg lg:shadow-none border border-white/20 lg:border-none">
                    
                    {/* Header Khusus Mobile (Logo Kecil & Judul Putih) */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 mx-auto rounded-xl bg-white/20 flex items-center justify-center mb-4 shadow-inner border border-white/30">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">SIM-Tren</h2>
                        <p className="text-blue-100 text-sm mt-1">Sistem Informasi Manajemen Pesantren</p>
                    </div>

                    {/* Header Desktop (Judul Hitam) */}
                    <div className="hidden lg:block mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
                        <p className="text-gray-500">Silakan masuk menggunakan akun Anda</p>
                    </div>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 lg:bg-red-50 border border-red-500/30 lg:border-red-200 text-white lg:text-red-600 rounded-xl flex items-center text-sm font-medium backdrop-blur-sm">
                            <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            {/* Label: Putih di Mobile, Abu di Desktop */}
                            <label className="block text-sm font-semibold text-blue-100 lg:text-gray-700 mb-2 ml-1">
                                NIS / Nomor HP
                            </label>
                            <input 
                                type="text" 
                                placeholder="Masukkan NIS atau No. HP Anda" 
                                className="w-full px-4 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-blue-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-blue-500 focus:border-transparent lg:focus:border-blue-500 outline-none transition-all"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2 ml-1">
                                <label className="text-sm font-semibold text-blue-100 lg:text-gray-700">
                                    Kata Sandi
                                </label>
                                <button 
                                    type="button"
                                    className="text-white lg:text-blue-600 hover:text-blue-200 lg:hover:text-blue-700 hover:underline text-sm font-medium transition-colors"
                                    onClick={() => alert("Silakan hubungi administrator pondok untuk reset password.")}
                                >
                                    Lupa kata sandi?
                                </button>
                            </div>
                            <input 
                                type="password" 
                                placeholder="Masukkan Kata Sandi" 
                                className="w-full px-4 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-blue-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-blue-500 focus:border-transparent lg:focus:border-blue-500 outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3.5 rounded-xl font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-6 bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl lg:bg-blue-600 lg:text-white lg:hover:bg-blue-700 lg:hover:shadow-blue-500/30"
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
                            ) : "Masuk"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-blue-100 lg:text-gray-500 text-sm">
                            Belum punya akun?{" "}
                            <button 
                                onClick={() => setOpenRegister(true)} 
                                className="text-white lg:text-blue-600 hover:text-blue-200 lg:hover:text-blue-800 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-white/30 lg:decoration-transparent"
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