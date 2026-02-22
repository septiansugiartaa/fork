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
    const [openForgot, setOpenForgot] = useState(false);
    const [forgotData, setForgotData] = useState({
        role: "Santri", nama: "", nip: ""
    });
    
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
                else if (role === 'admin') navigate('/admin', { replace: true });
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
            else navigate('/login');
            
        } catch (err) {
            console.error('Login error:', err);
            if (err.response) setError(err.response.data.message || 'Login gagal');
            else if (err.request) setError('Tidak dapat terhubung ke server');
            else setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKirimWA = (e) => {
        e.preventDefault();
        
        if (!forgotData.nama || !forgotData.nip) {
            alert("Nama dan NIS/NIP wajib diisi!");
            return;
        }

        const nomorAdmin = "6287876383817"; 
        
        // Format pesan sesuai kemauanmu
        const pesan = `[Permintaan Reset Kata Sandi Akun ${forgotData.role} SIM-Tren PPDNY]\nAtas nama: *${forgotData.nama}*\nNIS/NIP: *${forgotData.nip}*`;
        
        // Encode teks agar aman di URL
        const waUrl = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`;
        
        // Buka tab baru ke WhatsApp
        window.open(waUrl, "_blank");
        
        // Tutup modal dan reset form
        setOpenForgot(false);
        setForgotData({ role: "Santri", nama: "", nip: "" });
    };

    return (
        // Wrapper Utama: Di Mobile jadi background biru gradient, di Desktop Row biasa
        <div className="min-h-screen flex bg-gradient-to-br from-green-600 to-green-500">
            <div className="min-h-screen absolute inset-0 bg-[url('../src/assets/header.png')] bg-cover bg-left md:hidden"></div>
            
            {/* --- KOLOM KIRI (DESKTOP) --- */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-green-600 to-green-500 to-green-600 text-white flex-col justify-center items-center px-12 relative overflow-hidden bg-login">
                <div className="absolute inset-0 bg-[url('../src/assets/header.png')] opacity-80 bg-cover bg-left "></div>

                <div className="flex flex-col items-center text-center max-w-md relative z-10 -mt-16">
                    <div className="p-30 w-144 h-144 rounded-full flex items-center justify-center bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,rgba(0,0,0,0)_60%)]">
                        <img src="../src/assets/logo.png" alt="" />
                    </div>
                    <span className="text-5xl -mt-28 z-5 mb-3 tracking-tight simtren flex">
                        <h1 className="font-black pr-4">S I M</h1>
                        <h1 className="font-light">- T r e n</h1>
                    </span>
                    <p className="text-lg font-medium mb-6 z-5 text-green-100">Sistem Informasi Manajemen Pesantren</p>
                </div>
            </div>

            {/* --- KOLOM KANAN (FORM LOGIN) --- */}
            <div className="flex w-full lg:w-1/2 justify-center items-center px-4 sm:px-6 lg:bg-white">
                
                <div className="w-full max-w-lg bg-white/20 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none p-8 rounded-3xl shadow-lg lg:shadow-none border border-white/20 lg:border-none">
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-24 h-24 mx-auto flex items-center justify-center mb-4">
                            <img src="../src/assets/logo.png" alt="" />
                        </div>
                        <span>
                            <h2 className="text-2xl font-black text-white inline">SIM</h2>
                            <h2 className="text-2xl font-normal text-white inline">-Tren</h2>
                        </span>
                        <p className="text-green-100 text-sm mt-1">Sistem Informasi Manajemen Pesantren</p>
                    </div>

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
                            <label className="block text-sm font-semibold text-green-100 lg:text-gray-700 mb-2 ml-1">
                                NIS / No. HP / Email
                            </label>
                            <input 
                                type="text" 
                                placeholder="Masukkan NIS atau No. HP atau Email Anda" 
                                className="w-full px-4 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-green-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-green-500 focus:border-transparent lg:focus:border-green-500 outline-none transition-all"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2 ml-1">
                                <label className="text-sm font-semibold text-green-100 lg:text-gray-700">
                                    Kata Sandi
                                </label>
                                <button 
                                    type="button"
                                    className="text-white lg:text-green-600 hover:text-green-200 lg:hover:text-green-700 hover:underline text-sm font-medium transition-colors"
                                    onClick={() => {
                                        // Auto-fill NIP jika user sudah ngetik di form login
                                        setForgotData(prev => ({ ...prev, nip: identifier }));
                                        setOpenForgot(true);
                                    }}
                                >
                                    Lupa kata sandi?
                                </button>
                            </div>
                            <input 
                                type="password" 
                                placeholder="Masukkan Kata Sandi" 
                                className="w-full px-4 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-green-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-green-500 focus:border-transparent lg:focus:border-green-500 outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3.5 rounded-xl font-bold text-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-6 bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl lg:bg-green-600 lg:text-white lg:hover:bg-green-700 lg:hover:shadow-green-500/30"
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
                        <p className="text-green-100 lg:text-gray-500 text-sm">
                            Belum punya akun?{" "}
                            <button 
                                onClick={() => setOpenRegister(true)} 
                                className="text-white lg:text-green-600 hover:text-green-200 lg:hover:text-green-800 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-white/30 lg:decoration-transparent"
                                disabled={loading}
                            >
                                Daftar Sekarang
                            </button>
                        </p>
                    </div>

                    {/* --- MODAL LUPA PASSWORD --- */}
                    {openForgot && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">Reset Kata Sandi</h3>
                                        <p className="text-xs text-gray-500 mt-1">Hubungi Admin via WhatsApp</p>
                                    </div>
                                    <button 
                                        onClick={() => setOpenForgot(false)} 
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                                
                                <form onSubmit={handleKirimWA} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipe Akun</label>
                                        <select 
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
                                            value={forgotData.role}
                                            onChange={(e) => setForgotData({...forgotData, role: e.target.value})}
                                        >
                                            <option value="Santri">Santri</option>
                                            <option value="Orang Tua">Orang Tua / Wali</option>
                                            <option value="Pengurus">Pengurus Pondok</option>
                                            <option value="Ustadz">Ustadz / Guru</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                                        <input 
                                            type="text" 
                                            placeholder="Contoh: Ahmad Fulan"
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
                                            value={forgotData.nama}
                                            onChange={(e) => setForgotData({...forgotData, nama: e.target.value})}
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">NIS / NIP / No. HP</label>
                                        <input 
                                            type="text" 
                                            placeholder="Masukkan identitas terdaftar"
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
                                            value={forgotData.nip}
                                            onChange={(e) => setForgotData({...forgotData, nip: e.target.value})}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            type="submit" 
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex justify-center items-center shadow-md shadow-green-200"
                                        >
                                            {/* Ikon WhatsApp SVG */}
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                            Kirim ke WhatsApp
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <RegisterModal
                    open={openRegister}
                    onClose={() => setOpenRegister(false)}
                />
            </div>
        </div>
    );
}