import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { Loader2, Eye, EyeOff, X, ArrowLeft } from "lucide-react";
import RegisterModal from "../components/RegisterModal";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

// Map role → dashboard path (konsisten dengan ProtectedRoutes.jsx)
const ROLE_DASHBOARD = {
  santri:       "/santri",
  orangtua:     "/orangtua",
  wali:         "/orangtua",
  pengurus:     "/pengurus",
  pimpinan:     "/pimpinan",
  ustadz:       "/ustadz",
  admin:        "/admin",
  timkesehatan: "/timkesehatan",
};

export default function Login() {
  const [openRegister, setOpenRegister] = useState(false);

  // Auth States
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { message, showAlert, clearAlert } = useAlert();

  // Multi-Role States
  const [step, setStep] = useState(1); // 1 = Form Login, 2 = Pilih Role
  const [availableRoles, setAvailableRoles] = useState([]);
  // PATCH: simpan selectionToken (bukan userId mentah) untuk finalizeLogin
  const [selectionToken, setSelectionToken] = useState(null);

  const [openForgot, setOpenForgot] = useState(false);
  const [forgotData, setForgotData] = useState({ role: "Santri", nama: "", nip: "" });

  const navigate = useNavigate();

  const getRoleSafe = (user) => {
    if (!user) return null;
    if (typeof user.role === "string") return user.role.toLowerCase();
    if (Array.isArray(user.user_role)) {
      return user.user_role[0]?.role?.role?.toLowerCase() ?? null;
    }
    return null;
  };

  const redirectByRole = (role, replace = false) => {
    const path = ROLE_DASHBOARD[role] ?? "/login";
    navigate(path, { replace });
  };

  // Session check saat mount
  useEffect(() => {
    const token   = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        redirectByRole(getRoleSafe(user), true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- HANDLER STEP 1: LOGIN AWAL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Identitas dan kata sandi harus diisi.");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", { identifier, password });

      if (response.data.requireRoleSelection) {
        setAvailableRoles(response.data.availableRoles);
        // PATCH: simpan selectionToken, bukan userId
        setSelectionToken(response.data.selectionToken);
        setStep(2);
      } else {
        const { token, user } = response.data;
        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user || {}));
        }
        redirectByRole(getRoleSafe(user));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER STEP 2: FINALIZE ROLE ---
  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    setError("");
    try {
      // PATCH: kirim selectionToken + selectedRole (bukan userId + selectedRole)
      const response = await api.post("/auth/finalize-login", {
        selectionToken,
        selectedRole,
      });

      const { token, user } = response.data;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user || {}));
      }
      redirectByRole(getRoleSafe(user));
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memilih role.");
      setStep(1);
      setSelectionToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKirimWA = (e) => {
    e.preventDefault();
    if (!forgotData.nama || !forgotData.nip) return showAlert("error", "Nama dan NIS/NIP wajib diisi!");
    const nomorAdmin = "6287876383817";
    const pesan = `[Permintaan Reset Kata Sandi Akun ${forgotData.role} SIM-Tren PPDNY]\nAtas nama: *${forgotData.nama}*\nNIS/NIP: *${forgotData.nip}*`;
    window.open(`https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`, "_blank");
    setOpenForgot(false);
    setForgotData({ role: "Santri", nama: "", nip: "" });
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-600 to-green-500">
      <div className="min-h-screen absolute inset-0 bg-[url('../src/assets/header.png')] bg-cover bg-left md:hidden"></div>
      <AlertToast message={message} onClose={clearAlert} />

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
          <p className="text-lg font-medium mb-6 z-5 text-green-100">
            Sistem Informasi Manajemen Pesantren
          </p>
        </div>
      </div>

      {/* --- KOLOM KANAN (FORM LOGIN) --- */}
      <div className="flex w-full lg:w-1/2 justify-center items-center px-4 sm:px-6 lg:bg-white relative z-10">
        <div className="w-full max-w-lg bg-white/20 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none p-8 rounded-3xl shadow-lg lg:shadow-none border border-white/20 lg:border-none">
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2 text-white lg:text-gray-800 hover:text-white lg:hover:text-green-600 font-bold text-lg transition-colors z-50"
          >
            <ArrowLeft size={24} strokeWidth={3} />
            <span className="hidden md:inline">Kembali ke Beranda</span>
          </button>
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
            <p className="text-gray-500">
              {step === 1 ? "Silakan masuk menggunakan akun Anda" : "Sistem mendeteksi beberapa akses pada akun Anda"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 lg:bg-red-50 border border-red-500/30 lg:border-red-200 text-white lg:text-red-600 rounded-xl flex items-center text-sm font-medium backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-semibold text-green-100 lg:text-gray-700 mb-2 ml-1">
                    NIS / No. HP / Email
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan NIS atau No. HP atau Email Anda"
                    className="w-full px-4 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-green-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-green-500 outline-none transition-all"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2 ml-1">
                    <label className="text-sm font-semibold text-green-100 lg:text-gray-700">Kata Sandi</label>
                    <button
                      type="button"
                      className="text-white lg:text-green-600 hover:text-green-200 lg:hover:text-green-700 hover:underline text-sm font-medium transition-colors"
                      onClick={() => { setForgotData((prev) => ({ ...prev, nip: identifier })); setOpenForgot(true); }}
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan Kata Sandi"
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/20 lg:bg-white border border-white/30 lg:border-gray-300 text-white lg:text-gray-900 placeholder-green-200 lg:placeholder-gray-400 focus:ring-2 focus:ring-white/50 lg:focus:ring-green-500 outline-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white lg:text-gray-400 lg:hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-lg transition-all disabled:opacity-70 flex justify-center items-center mt-6 bg-white text-green-600 hover:bg-green-50 shadow-lg lg:bg-green-600 lg:text-white lg:hover:bg-green-700 lg:hover:shadow-green-500/30"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Masuk"}
                </button>
              </form>

              <div className="mt-8 text-center animate-in fade-in">
                <p className="text-green-100 lg:text-gray-500 text-sm">
                  Belum punya akun?{" "}
                  <button
                    onClick={() => setOpenRegister(true)}
                    className="text-white lg:text-green-600 font-bold transition-colors underline decoration-2 underline-offset-4 decoration-white/30 lg:decoration-transparent"
                    disabled={loading}
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-center text-green-100 lg:text-gray-600 font-medium mb-6">
                Pilih ruang kerja Anda untuk sesi ini:
              </p>
              <div className="grid gap-3">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-bold text-md transition-all flex justify-between items-center group bg-white/20 lg:bg-white border border-white/30 lg:border-green-200 text-white lg:text-green-700 hover:bg-white/40 lg:hover:bg-green-50 lg:hover:border-green-400 shadow-sm"
                  >
                    <span className="uppercase tracking-wider">{role}</span>
                    <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setStep(1); setSelectionToken(null); }}
                disabled={loading}
                className="w-full py-3 mt-4 rounded-xl font-semibold text-green-100 lg:text-gray-500 hover:text-white lg:hover:text-gray-800 transition-colors"
              >
                Batal & Kembali
              </button>
            </div>
          )}

          {/* --- MODAL LUPA PASSWORD --- */}
          {openForgot && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Reset Kata Sandi</h3>
                    <p className="text-xs text-gray-500 mt-1">Hubungi Admin via WhatsApp</p>
                  </div>
                  <button onClick={() => setOpenForgot(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleKirimWA} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipe Akun</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
                      value={forgotData.role}
                      onChange={(e) => setForgotData({ ...forgotData, role: e.target.value })}
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
                      onChange={(e) => setForgotData({ ...forgotData, nama: e.target.value })}
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
                      onChange={(e) => setForgotData({ ...forgotData, nip: e.target.value })}
                    />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex justify-center items-center shadow-md shadow-green-200">
                      Kirim ke WhatsApp
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <RegisterModal open={openRegister} onClose={() => setOpenRegister(false)} />
      </div>
    </div>
  );
}
