import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import { 
  User, Save, Lock, Camera, ArrowLeft, Loader2, 
  AlertTriangle, CheckCircle, Trash2, Plus, Edit2, X, Search, Eye
} from "lucide-react";
import AlertToast from "../../components/AlertToast";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { useAlert } from "../../hooks/useAlert";

// Field wajib data diri yang harus semua terisi agar tidak bisa diedit
const REQUIRED_FIELDS = ['nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'email', 'no_hp', 'alamat'];

const isDataDiriLengkap = (data) => REQUIRED_FIELDS.every(f => data[f] && String(data[f]).trim() !== '');

export default function SantriProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();
  
  const [dataPondok, setDataPondok] = useState({});
  const [dataDiri, setDataDiri] = useState({});
  const [orangTua, setOrangTua] = useState([]);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  
  const [showOrtuModal, setShowOrtuModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editId, setEditId] = useState(null);
  
  const [newOrtu, setNewOrtu] = useState({ nama: "", hubungan: "", no_hp: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3 && formStep === 1) {
        setIsSearchingUser(true);
        try {
          const res = await api.get(`/santri/profile/orangtua/search?q=${searchQuery}`);
          if (res.data.success) setSearchResults(res.data.data);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearchingUser(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formStep]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/santri/profile");
      if (response.data.success) {
        const { data_pondok, data_diri, orang_tua } = response.data.data;
        setDataPondok(data_pondok);
        setDataDiri(data_diri);
        setOrangTua(orang_tua);
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
      await api.put("/santri/profile/update", dataDiri);
      showAlert("success", "Data diri berhasil disimpan");
      fetchProfile();
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
      await api.put("/santri/profile/password", { password_baru: passwordBaru });
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
      const res = await api.post('/santri/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        showAlert("success", "Foto profil berhasil diperbarui");
        fetchProfile();
      }
    } catch (err) {
      showAlert("error", "Gagal upload foto");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddOrtu = () => {
    setNewOrtu({ nama: "", hubungan: "", no_hp: "" });
    setSearchQuery("");
    setSearchResults([]);
    setIsEditing(false);
    setEditId(null);
    setFormStep(1);
    setIsManualInput(false);
    setShowOrtuModal(true);
  };

  const handleSelectUser = (user) => {
    setNewOrtu({ nama: user.nama, no_hp: user.no_hp, hubungan: "" });
    setIsManualInput(false);
    setFormStep(2);
  };

  const handleManualInput = () => {
    setNewOrtu({ nama: searchQuery, hubungan: "", no_hp: "" });
    setIsManualInput(true);
    setFormStep(2);
  };

  const handleSubmitOrtu = async (e) => {
    e.preventDefault();
    if (!newOrtu.nama || !newOrtu.hubungan || !newOrtu.no_hp) {
      showAlert("error", "Semua data wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/santri/profile/orangtua/${editId}`, newOrtu);
        showAlert("success", "Data berhasil diperbarui");
      } else {
        await api.post("/santri/profile/orangtua", newOrtu);
        showAlert("success", isManualInput 
          ? "Data berhasil ditambah! Akun wali baru telah dibuat." 
          : "Data berhasil ditautkan! Akun wali yang ada telah dihubungkan."
        );
      }
      fetchProfile();
      setShowOrtuModal(false);
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const [deleteOrtuModal, setDeleteOrtuModal] = useState({ isOpen: false, id: null, loading: false });
  const handleDeleteOrtu = (id) => setDeleteOrtuModal({ isOpen: true, id, loading: false });
  const confirmDeleteOrtu = async () => {
    setDeleteOrtuModal(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/santri/profile/orangtua/${deleteOrtuModal.id}`);
      setDeleteOrtuModal({ isOpen: false, id: null, loading: false });
      fetchProfile();
      showAlert("success", "Data berhasil dihapus");
    } catch (err) {
      showAlert("error", "Gagal menghapus data");
      setDeleteOrtuModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-green-600" /></div>;

  const dataDiriLengkap = isDataDiriLengkap(dataDiri);
  const sudahAdaOrtu = orangTua.length > 0;
  const inputClass = "w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed";
  const editInputClass = "w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none";

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/santri")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Profil Santri</h1>
            <p className="text-green-100 text-sm truncate">Informasi pribadi dan akun</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 space-y-6 relative z-10">
        
        {/* 1. Foto Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-left">Foto Profil</h2>
          <div className="relative inline-block group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-md mx-auto overflow-hidden">
              {dataDiri.foto_profil ? <img src={`/foto-profil/${dataDiri.foto_profil}`} alt="Profil" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; }} /> : <User size={64} className="text-green-400" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current.click()} disabled={saving} className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 shadow-sm transition border-2 border-white cursor-pointer">{saving ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}</button>
          </div>
          <p className="mt-4 text-sm text-gray-500">Unggah Foto Profil<br/><span className="text-xs">Format JPG/PNG, Maks 2MB</span></p>
        </div>

        {/* 2. Data Pondok */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Data Pondok</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">NIS</label><input type="text" value={dataPondok.nis || ''} disabled className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label><input type="text" value={dataPondok.kelas || ''} disabled className={inputClass} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Kamar</label><input type="text" value={dataPondok.kamar || ''} disabled className={inputClass} /></div>
          </div>
        </div>

        {/* 3. Data Diri */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Data Diri</h2>
              {dataDiriLengkap && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" /> Data sudah lengkap
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dataDiriLengkap && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1">
                  <AlertTriangle size={12} /> Tidak bisa diedit
                </span>
              )}
              <button type="button" onClick={() => setShowPasswordModal(true)} className="text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition flex items-center">
                <Lock size={16} className="mr-2" /> Ganti Kata Sandi
              </button>
            </div>
          </div>

          {dataDiriLengkap ? (
            /* View-only mode */
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label><div className={inputClass}>{dataDiri.nama_lengkap}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Jenis Kelamin</label><div className={inputClass}>{dataDiri.jenis_kelamin === 'Laki_laki' ? 'Laki-laki' : 'Perempuan'}</div></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Tempat Lahir</label><div className={inputClass}>{dataDiri.tempat_lahir}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Tanggal Lahir</label><div className={inputClass}>{dataDiri.tanggal_lahir}</div></div>
                <div><label className="block text-sm font-medium text-gray-500 mb-1">Email</label><div className={inputClass}>{dataDiri.email}</div></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Nomor HP</label><div className={inputClass}>{dataDiri.no_hp}</div></div>
              <div><label className="block text-sm font-medium text-gray-500 mb-1">Alamat Tinggal</label><div className={`${inputClass} min-h-[80px]`}>{dataDiri.alamat}</div></div>
            </div>
          ) : (
            /* Editable mode - ada field kosong */
            <form onSubmit={handleUpdateDataDiri} className="space-y-4">
              {!dataDiriLengkap && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700">Beberapa data masih kosong. Lengkapi semua data agar profil dikunci dan tidak bisa diubah lagi.</p>
                </div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" value={dataDiri.nama_lengkap || ''} onChange={(e) => setDataDiri({...dataDiri, nama_lengkap: e.target.value})} className={editInputClass} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select value={dataDiri.jenis_kelamin || ''} onChange={(e) => setDataDiri({...dataDiri, jenis_kelamin: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"><option value="" disabled>Pilih...</option><option value="Laki_laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label><input type="text" value={dataDiri.tempat_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tempat_lahir: e.target.value})} className={editInputClass} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label><input type="date" value={dataDiri.tanggal_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tanggal_lahir: e.target.value})} className={editInputClass} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={dataDiri.email || ''} onChange={(e) => setDataDiri({...dataDiri, email: e.target.value})} className={editInputClass} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label><input type="text" value={dataDiri.no_hp || ''} onChange={(e) => setDataDiri({...dataDiri, no_hp: e.target.value})} className={editInputClass} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Tinggal</label><textarea rows="3" value={dataDiri.alamat || ''} onChange={(e) => setDataDiri({...dataDiri, alamat: e.target.value})} className={`${editInputClass} resize-none`} /></div>
              <div className="pt-2"><button type="submit" disabled={saving} className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition flex items-center justify-center disabled:bg-green-300">{saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />} Simpan Data Diri</button></div>
            </form>
          )}
        </div>

        {/* 4. Data Orang Tua */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Data Orang Tua/Wali</h2>
              {sudahAdaOrtu && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" /> Data sudah ada &mdash; tidak bisa diedit
                </p>
              )}
            </div>
            {!sudahAdaOrtu && (
              <button onClick={handleOpenAddOrtu} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium transition flex items-center w-full md:w-auto justify-center">
                <Plus size={16} className="mr-1" /> Tambah Data
              </button>
            )}
          </div>

          <div className="block md:hidden space-y-4 w-full">
            {orangTua.map((ortu, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
                <div><h4 className="font-bold text-gray-800">{ortu.nama}</h4><span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-block mt-1">{ortu.hubungan}</span></div>
                <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded-lg border border-gray-100">{ortu.no_hp}</div>
              </div>
            ))}
            {orangTua.length === 0 && <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300"><p className="text-gray-500 text-sm">Belum ada data orang tua</p></div>}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"><th className="p-3 rounded-tl-lg">Nama Wali</th><th className="p-3">Hubungan</th><th className="p-3 rounded-tr-lg">Nomor HP</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {orangTua.map((ortu, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="p-3 text-sm font-medium text-gray-800">{ortu.nama}</td>
                    <td className="p-3 text-sm text-gray-600">{ortu.hubungan}</td>
                    <td className="p-3 text-sm text-gray-600">{ortu.no_hp}</td>
                  </tr>
                ))}
                {orangTua.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-sm text-gray-500">Belum ada data orang tua</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Tambah Orang Tua */}
      {showOrtuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center">
                <User className="mr-2 text-green-600" size={20} /> Tambah Data Wali
              </h3>
              <button onClick={() => setShowOrtuModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <input type="text" placeholder="Cari Nama atau No. HP..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    {isSearchingUser && <Loader2 className="absolute right-3 top-3.5 text-green-500 animate-spin" size={20} />}
                  </div>
                  <div className="space-y-2 h-48 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-green-300 hover:bg-green-50 transition flex justify-between items-center group">
                          <div><p className="font-semibold text-gray-800">{user.nama}</p><p className="text-xs text-gray-500">{user.no_hp}</p></div>
                          <div className="text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition">Pilih</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        {isSearchingUser ? <p className="text-sm text-gray-500">Mencari data...</p>
                          : searchQuery.length > 0 && searchQuery.length < 3 ? <p className="text-sm text-gray-400">Ketik minimal 3 karakter...</p>
                          : searchQuery.length >= 3 ? <p className="text-sm text-gray-500">Data tidak ditemukan.</p>
                          : <p className="text-sm text-gray-400">Silakan cari data wali yang sudah terdaftar.</p>}
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button onClick={handleManualInput} className="w-full flex items-center justify-center p-3 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition">
                      <Plus size={16} className="mr-2" /> Input Manual / Buat Baru
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-2">Gunakan ini jika data wali belum pernah terdaftar di sistem.</p>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <form onSubmit={handleSubmitOrtu} className="space-y-4">
                  {!isManualInput && (
                    <div className="bg-green-50 p-3 rounded-lg flex items-start gap-3 mb-2">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-green-800"><p className="font-bold">Data Ditemukan!</p><p className="text-xs mt-1">Silakan isi hubungan keluarga saja.</p></div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input type="text" value={newOrtu.nama} onChange={e=>setNewOrtu({...newOrtu, nama:e.target.value})} disabled={!isManualInput} className={`w-full p-3 border rounded-xl outline-none ${!isManualInput ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:ring-2 focus:ring-green-500'}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP (Login)</label>
                    <input type="text" value={newOrtu.no_hp} onChange={e=>setNewOrtu({...newOrtu, no_hp:e.target.value})} disabled={!isManualInput} className={`w-full p-3 border rounded-xl outline-none ${!isManualInput ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:ring-2 focus:ring-green-500'}`} />
                    {isManualInput && <p className="text-xs text-gray-400 mt-1">*Nomor ini akan digunakan untuk login wali.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hubungan</label>
                    <input type="text" placeholder="Contoh: Ayah Kandung, Ibu, Wali" value={newOrtu.hubungan} onChange={e=>setNewOrtu({...newOrtu, hubungan:e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" autoFocus />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setFormStep(1)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Kembali</button>
                    <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:bg-green-300">{saving ? "Menyimpan..." : "Simpan Data"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center"><Lock className="mr-2 text-green-600" size={20} /> Ganti Kata Sandi</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label><input type="password" placeholder="Minimal 6 karakter" value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</label><input type="password" placeholder="Ulangi kata sandi baru" value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Batal</button><button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:bg-green-300">{saving ? "Menyimpan..." : "Simpan Password"}</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal isOpen={deleteOrtuModal.isOpen} onClose={() => setDeleteOrtuModal({ isOpen: false, id: null, loading: false })} onConfirm={confirmDeleteOrtu} loading={deleteOrtuModal.loading} itemName="data ini" />
    </div>
  );
}
