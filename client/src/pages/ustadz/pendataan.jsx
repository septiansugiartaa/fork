import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { 
  User, Save, Lock, Camera, ArrowLeft, Loader2, 
  AlertTriangle, CheckCircle, X
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

// Import komponen Password Modal
import PasswordModal from "../../components/PasswordModal";

export default function UstadzProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();
  
  // State Data Utama
  const [dataKepegawaian, setDataKepegawaian] = useState({});
  const [dataDiri, setDataDiri] = useState({});
  const [fotoProfil, setFotoProfil] = useState(null);
  
  // State Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ustadz/profile");
      if (response.data.success) {
        const { data_kepegawaian, data_diri, foto_profil } = response.data.data;
        setDataKepegawaian(data_kepegawaian);
        setDataDiri(data_diri);
        setFotoProfil(foto_profil);
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
      await api.put("/ustadz/profile/update", dataDiri);
      showAlert("success", "Data diri berhasil disimpan");
    } catch (err) {
      showAlert("error", "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  // Fungsi ini sekarang menerima parameter passwordBaru dari PasswordModal
  const handleSubmitPassword = async (passwordBaru) => {
    setSaving(true);
    try {
      await api.put("/ustadz/profile/password", { password_baru: passwordBaru });
      showAlert("success", "Password berhasil diubah");
      setShowPasswordModal(false);
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
      const res = await api.post('/ustadz/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      <AlertToast message={message} onClose={clearAlert} />

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/ustadz")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Profil Ustadz/Pengajar</h1>
            <p className="text-green-100 text-sm truncate">Kelola informasi pribadi dan keamanan akun</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 space-y-6 relative z-10">
        
        {/* 1. Foto Profil */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="relative inline-block group mb-2">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-lg mx-auto overflow-hidden">
              {dataDiri.foto_profil ? <img src={`/foto-profil/${dataDiri.foto_profil}`} alt="Profil" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ""; setFotoProfil(null); }} /> : <User size={64} className="text-green-400" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current.click()} disabled={saving} className="absolute bottom-0 right-0 bg-green-600 text-white p-2.5 rounded-full hover:bg-green-700 shadow-md transition border-2 border-white cursor-pointer">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-2">Unggah Foto Profil (Maks. 2MB)</p>
        </div>

        {/* 2. Data Kepegawaian */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Data Kepegawaian</h2>
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nomor Induk Pegawai (NIP)</label>
              <input type="text" value={dataKepegawaian.nip || ''} disabled className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed" />
          </div>
        </div>

        {/* 3. Data Diri Form */}
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                  <input type="date" value={dataDiri.tanggal_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tanggal_lahir: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tempat Lahir</label>
                  <input type="text" value={dataDiri.tempat_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tempat_lahir: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={dataDiri.email || ''} onChange={(e) => setDataDiri({...dataDiri, email: e.target.value})} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition" />
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nomor Handphone / WhatsApp</label>
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

      </div>

      {/* Gunakan Komponen PasswordModal di Sini */}
      <PasswordModal 
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handleSubmitPassword}
          saving={saving}
      />

    </div>
  );
}