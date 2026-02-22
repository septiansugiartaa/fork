import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  User, Save, Lock, Camera, ArrowLeft, Loader2, 
  AlertTriangle, CheckCircle, X, Users
} from "lucide-react";

export default function OrangTuaProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [dataDiri, setDataDiri] = useState({});
  const [anakList, setAnakList] = useState([]);
  const [fotoProfil, setFotoProfil] = useState(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const API_URL = "http://localhost:3000/api/orangtua/profile"; 

  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/");
      if (response.data.success) {
        const { data_diri, foto_profil, anak } = response.data.data;
        setDataDiri(data_diri);
        setFotoProfil(foto_profil);
        setAnakList(anak);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDataDiri = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/update", dataDiri);
      showAlert("success", "Data diri berhasil disimpan");
    } catch (err) {
      showAlert("error", "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordBaru.length < 6) { showAlert("error", "Password minimal 6 karakter"); return; }
    if (passwordBaru !== konfirmasiPassword) { showAlert("error", "Konfirmasi password tidak cocok!"); return; }
    setSaving(true);
    try {
      await api.put("/password", { password_baru: passwordBaru });
      showAlert("success", "Password berhasil diubah");
      setPasswordBaru(""); setKonfirmasiPassword(""); setShowPasswordModal(false);
    } catch (err) {
      showAlert("error", "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showAlert("error", "Ukuran file max. 2MB"); return; }
    
    const formData = new FormData();
    formData.append('foto', file); 
    
    try {
      setSaving(true); 
      const res = await api.post('/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
          setFotoProfil(res.data.data.url);
          showAlert("success", "Foto profil berhasil diperbarui");
      }
    } catch (err) {
      showAlert("error", "Gagal upload foto");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      
      {/* Toast Notification */}
      {message.text && (
        <div className={`z-101 fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/orangtua")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Profil Wali Santri</h1>
            <p className="text-green-100 text-sm truncate">Kelola data pribadi dan informasi kontak</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 space-y-6 relative z-10">
        
        {/* 1. Foto Profil */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="relative inline-block group mb-2">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-lg mx-auto overflow-hidden">
              {fotoProfil ? <img src={fotoProfil} alt="Profil" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ""; setFotoProfil(null); }} /> : <User size={64} className="text-green-400" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current.click()} disabled={saving} className="absolute bottom-0 right-0 bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 shadow-md transition border-2 border-white cursor-pointer">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2">Unggah Foto Profil (Maks. 2MB)</p>
        </div>

        {/* 2. Data Diri Form */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Informasi Pribadi</h2>
            <button type="button" onClick={() => setShowPasswordModal(true)} className="text-sm font-bold text-green-600 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition flex items-center">
                <Lock size={16} className="mr-2" /> Ganti Sandi
            </button>
          </div>
          <form onSubmit={handleUpdateDataDiri} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input type="text" value={dataDiri.nama_lengkap || ''} onChange={(e) => setDataDiri({...dataDiri, nama_lengkap: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jenis Kelamin</label>
                  <select value={dataDiri.jenis_kelamin || ''} onChange={(e) => setDataDiri({...dataDiri, jenis_kelamin: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white transition">
                      <option value="" disabled>Pilih...</option>
                      <option value="Laki_laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                  </select>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={dataDiri.email || ''} onChange={(e) => setDataDiri({...dataDiri, email: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nomor Handphone (WhatsApp)</label>
                <input type="text" value={dataDiri.no_hp || ''} onChange={(e) => setDataDiri({...dataDiri, no_hp: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Alamat Tinggal</label>
                <textarea rows="3" value={dataDiri.alamat || ''} onChange={(e) => setDataDiri({...dataDiri, alamat: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none transition" />
            </div>
            
            <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={saving} className="w-full md:w-auto px-8 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center disabled:bg-green-300">
                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />} Simpan Pembaruan
                </button>
            </div>
          </form>
        </div>

        {/* 3. Daftar Anak (View Only) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center"><Users className="mr-2 text-indigo-500" size={24}/> Daftar Santri Terhubung</h2>
            <p className="text-sm text-gray-500 mt-1">Data santri yang terhubung dengan akun Anda. Hubungi pengurus jika terdapat kesalahan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anakList.map((anak, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-white shadow-sm">
                   {anak.foto ? <img src={anak.foto} className="w-full h-full object-cover" alt={anak.nama}/> : anak.nama.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-800 text-md truncate">{anak.nama}</h4>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-lg">NIS: {anak.nip}</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">{anak.kelas}</span>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-lg">{anak.hubungan}</span>
                  </div>
                </div>
              </div>
            ))}
            {anakList.length === 0 && (
                <div className="col-span-full text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Belum ada data anak yang terhubung.</p>
                </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Password */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-xl flex items-center"><Lock className="mr-2 text-green-600" size={24} /> Ganti Kata Sandi</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition"><X size={20} /></button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
                    <input type="password" placeholder="Minimal 6 karakter" value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Konfirmasi Kata Sandi</label>
                    <input type="password" placeholder="Ulangi kata sandi baru" value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
                    <button type="submit" disabled={saving} className="flex-1 px-4 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:bg-green-300">
                        {saving ? "Menyimpan..." : "Simpan Sandi"}
                    </button>
                </div>
              </form>
            </div>
          </div>
      )}

    </div>
  );
}