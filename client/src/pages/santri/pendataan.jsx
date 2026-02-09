import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  User, Save, Lock, Camera, ArrowLeft, Loader2, 
  AlertTriangle, CheckCircle, Trash2, Plus, Edit2, X, Search 
} from "lucide-react";

export default function SantriProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // State Data Utama
  const [dataPondok, setDataPondok] = useState({});
  const [dataDiri, setDataDiri] = useState({});
  const [orangTua, setOrangTua] = useState([]);
  const [fotoProfil, setFotoProfil] = useState(null);
  
  // State Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  
  // --- STATE BARU: MODAL ORANG TUA ---
  const [showOrtuModal, setShowOrtuModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editId, setEditId] = useState(null);
  
  // State untuk Form & Search
  const [newOrtu, setNewOrtu] = useState({ nama: "", hubungan: "", no_hp: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false); // false = mode search/readonly, true = mode input manual
  const [formStep, setFormStep] = useState(1); // 1 = Search, 2 = Form Input

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  const API_URL = "http://localhost:3000/api/santri/profile"; 

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

  // --- LOGIKA SEARCH ORANG TUA ---
  useEffect(() => {
    // Debounce search (tunggu 500ms setelah mengetik baru request)
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3 && formStep === 1) {
        setIsSearchingUser(true);
        try {
          const res = await api.get(`/orangtua/search?q=${searchQuery}`);
          if (res.data.success) {
            setSearchResults(res.data.data);
          }
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
      const response = await api.get("/");
      if (response.data.success) {
        const { data_pondok, data_diri, orang_tua, foto_profil } = response.data.data;
        setDataPondok(data_pondok);
        setDataDiri(data_diri);
        setOrangTua(orang_tua);
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
    setMessage({ type: "", text: "" });
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

  // --- LOGIKA MODAL ORANG TUA ---

  const handleOpenAddOrtu = () => {
    setNewOrtu({ nama: "", hubungan: "", no_hp: "" });
    setSearchQuery("");
    setSearchResults([]);
    setIsEditing(false);
    setEditId(null);
    setFormStep(1); // Mulai dari step Search
    setIsManualInput(false);
    setShowOrtuModal(true);
  };

  const handleEditClick = (ortu) => {
    setNewOrtu({
      nama: ortu.nama,
      hubungan: ortu.hubungan,
      no_hp: ortu.no_hp
    });
    setEditId(ortu.id);
    setIsEditing(true);
    // Kalau edit, langsung ke form dan mode manual (bisa edit semua)
    setFormStep(2);
    setIsManualInput(true); 
    setShowOrtuModal(true);
  };

  const handleSelectUser = (user) => {
    // User ditemukan: Isi form, set ke step 2, matikan manual input (readonly)
    setNewOrtu({
      nama: user.nama,
      no_hp: user.no_hp,
      hubungan: "" // Hubungan tetap harus diisi santri
    });
    setIsManualInput(false); // Nama & HP Readonly
    setFormStep(2);
  };

  const handleManualInput = () => {
    // User tidak ditemukan: Mode manual, semua bisa diedit
    setNewOrtu({ nama: searchQuery, hubungan: "", no_hp: "" }); // Pre-fill nama dari search query
    setIsManualInput(true);
    setFormStep(2);
  };

  const handleSubmitOrtu = async (e) => {
    e.preventDefault();
    if(!newOrtu.nama || !newOrtu.hubungan || !newOrtu.no_hp) {
      showAlert("error", "Semua data wajib diisi");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/orangtua/${editId}`, newOrtu);
        showAlert("success", "Data berhasil diperbarui");
      } else {
        await api.post("/orangtua", newOrtu);
        showAlert("success", isManualInput 
            ? "Data berhasil ditambah! Akun wali baru telah dibuat. Silakan login dengan memasukkan No. HP." 
            : "Data berhasil ditautkan! Akun wali yang ada telah dihubungkan. Silakan login dengan memasukkan No. HP."
        );
      }
      fetchProfile();
      setShowOrtuModal(false);
    } catch (err) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrtu = async (id) => {
    if (window.confirm("Yakin hapus data ini?")) {
      try {
        await api.delete(`/orangtua/${id}`);
        fetchProfile();
        showAlert("success", "Data berhasil dihapus");
      } catch (err) {
        showAlert("error", "Gagal menghapus data");
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      
      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-99 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 pb-24 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/santri")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"><ArrowLeft size={24} /></button>
          <div className="min-w-0"><h1 className="text-2xl font-bold truncate">Edit Profil</h1><p className="text-blue-100 text-sm truncate">Kelola informasi pribadi dan akun</p></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 space-y-6 relative z-10">
        
        {/* 1. Foto Profil */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-6 text-left">Foto Profil</h2>
          <div className="relative inline-block group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md mx-auto overflow-hidden">
              {fotoProfil ? <img src={fotoProfil} alt="Profil" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ""; setFotoProfil(null); }} /> : <User size={64} className="text-blue-400" />}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} />
            <button onClick={() => fileInputRef.current.click()} disabled={saving} className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-sm transition border-2 border-white cursor-pointer">{saving ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}</button>
          </div>
          <p className="mt-4 text-sm text-gray-500">Unggah Foto Profil<br/><span className="text-xs">Format JPG/PNG, Maks 2MB</span></p>
        </div>

        {/* 2. Data Pondok */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Data Pondok</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">NIS</label><input type="text" value={dataPondok.nis || ''} disabled className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label><input type="text" value={dataPondok.kelas || ''} disabled className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Kamar</label><input type="text" value={dataPondok.kamar || ''} disabled className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600" /></div>
          </div>
        </div>

        {/* 3. Data Diri */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Data Diri</h2>
            <button type="button" onClick={() => setShowPasswordModal(true)} className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition flex items-center"><Lock size={16} className="mr-2" /> Ganti Kata Sandi</button>
          </div>
          <form onSubmit={handleUpdateDataDiri} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" value={dataDiri.nama_lengkap || ''} onChange={(e) => setDataDiri({...dataDiri, nama_lengkap: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select value={dataDiri.jenis_kelamin || ''} onChange={(e) => setDataDiri({...dataDiri, jenis_kelamin: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"><option value="">Pilih...</option><option value="Laki_laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label><input type="text" value={dataDiri.tempat_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tempat_lahir: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label><input type="date" value={dataDiri.tanggal_lahir || ''} onChange={(e) => setDataDiri({...dataDiri, tanggal_lahir: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={dataDiri.email || ''} onChange={(e) => setDataDiri({...dataDiri, email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label><input type="text" value={dataDiri.no_hp || ''} onChange={(e) => setDataDiri({...dataDiri, no_hp: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Tinggal</label><textarea rows="3" value={dataDiri.alamat || ''} onChange={(e) => setDataDiri({...dataDiri, alamat: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" /></div>
            <div className="pt-2"><button type="submit" disabled={saving} className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center disabled:bg-blue-300">{saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />} Simpan Data Diri</button></div>
          </form>
        </div>

        {/* 5. Manajemen Orang Tua */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <h2 className="text-lg font-bold text-gray-800">Data Orang Tua/Wali</h2>
            <button onClick={handleOpenAddOrtu} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium transition flex items-center w-full md:w-auto justify-center"><Plus size={16} className="mr-1" /> Tambah Data</button>
          </div>

          {/* Table & Cards (Display Only) */}
          <div className="block md:hidden space-y-4 w-full">
            {orangTua.map((ortu, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3 w-full">
                <div className="flex justify-between items-start gap-2"><div className="min-w-0 flex-1"><h4 className="font-bold text-gray-800 break-words leading-tight">{ortu.nama}</h4><div className="mt-1"><span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block">{ortu.hubungan}</span></div></div></div>
                <div className="flex items-center text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-100 w-full"><span className="font-mono truncate w-full">{ortu.no_hp}</span></div>
                <div className="flex gap-2 pt-2 border-t border-gray-200 mt-1"><button onClick={() => handleEditClick(ortu)} className="flex-1 flex items-center justify-center py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"><Edit2 size={14} className="mr-1" /> Edit</button><button onClick={() => handleDeleteOrtu(ortu.id)} className="flex-1 flex items-center justify-center py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={14} className="mr-1" /> Hapus</button></div>
              </div>
            ))}
            {orangTua.length === 0 && <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 w-full"><p className="text-gray-500 text-sm">Belum ada data orang tua</p></div>}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead><tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"><th className="p-3 rounded-tl-lg">Nama Wali</th><th className="p-3">Hubungan</th><th className="p-3">Nomor HP</th><th className="p-3 rounded-tr-lg text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {orangTua.map((ortu, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="p-3 text-sm font-medium text-gray-800">{ortu.nama}</td><td className="p-3 text-sm text-gray-600">{ortu.hubungan}</td><td className="p-3 text-sm text-gray-600">{ortu.no_hp}</td>
                    <td className="p-3 text-right space-x-2"><button onClick={() => handleEditClick(ortu)} className="text-blue-500 hover:text-blue-700 text-sm font-medium inline-flex items-center"><Edit2 size={14} className="mr-1" /> Edit</button><span className="text-gray-300">|</span><button onClick={() => handleDeleteOrtu(ortu.id)} className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center"><Trash2 size={14} className="mr-1" /> Hapus</button></td>
                  </tr>
                ))}
                {orangTua.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-sm text-gray-500">Belum ada data orang tua</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- MODAL ORANG TUA (SEARCH & INPUT) --- */}
      {showOrtuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center">
                <User className="mr-2 text-blue-600" size={20} /> 
                {isEditing ? "Edit Data Wali" : "Tambah Data Wali"}
              </h3>
              <button onClick={() => setShowOrtuModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {/* STEP 1: SEARCH */}
              {!isEditing && formStep === 1 && (
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari Nama atau No. HP..." 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    {isSearchingUser && <Loader2 className="absolute right-3 top-3.5 text-blue-500 animate-spin" size={20} />}
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2 h-48 overflow-y-auto"> {/* Added fixed height for scrolling if many results */}
                    {searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button 
                          key={user.id} 
                          onClick={() => handleSelectUser(user)}
                          className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition flex justify-between items-center group"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{user.nama}</p>
                            <p className="text-xs text-gray-500">{user.no_hp}</p>
                          </div>
                          <div className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">Pilih</div>
                        </button>
                      ))
                    ) : (
                      /* Status Message Area */
                      <div className="text-center py-8">
                          {isSearchingUser ? (
                            <p className="text-sm text-gray-500">Mencari data...</p>
                          ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
                            <p className="text-sm text-gray-400">Ketik minimal 3 karakter...</p>
                          ) : searchQuery.length >= 3 ? (
                            <p className="text-sm text-gray-500">Data tidak ditemukan.</p>
                          ) : (
                            <p className="text-sm text-gray-400">Silakan cari data wali yang sudah terdaftar.</p>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Manual Input Button - ALWAYS VISIBLE NOW */}
                  <div className="pt-2 border-t border-gray-100">
                      <button 
                          onClick={handleManualInput} 
                          className="w-full flex items-center justify-center p-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                      >
                          <Plus size={16} className="mr-2" />
                          Input Manual / Buat Baru
                      </button>
                      <p className="text-xs text-center text-gray-400 mt-2">
                          Gunakan ini jika data wali belum pernah terdaftar di sistem.
                      </p>
                  </div>
                </div>
              )}

              {/* STEP 2: FORM INPUT (Muncul jika Step 2 atau Mode Edit) */}
              {formStep === 2 && (
                <form onSubmit={handleSubmitOrtu} className="space-y-4">
                  {!isEditing && !isManualInput && (
                    <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 mb-2">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-blue-800">
                        <p className="font-bold">Data Ditemukan!</p>
                        <p className="text-xs mt-1">Akun wali sudah ada. Silakan isi hubungan keluarga saja.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={newOrtu.nama} 
                      onChange={e=>setNewOrtu({...newOrtu, nama:e.target.value})}
                      disabled={!isManualInput && !isEditing} // Readonly jika hasil search (kecuali mode edit forced)
                      className={`w-full p-3 border rounded-xl outline-none ${(!isManualInput && !isEditing) ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP (Login)</label>
                    <input 
                      type="text" 
                      value={newOrtu.no_hp} 
                      onChange={e=>setNewOrtu({...newOrtu, no_hp:e.target.value})}
                      disabled={!isManualInput && !isEditing} // Readonly jika hasil search
                      className={`w-full p-3 border rounded-xl outline-none ${(!isManualInput && !isEditing) ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200 focus:ring-2 focus:ring-blue-500'}`}
                    />
                    {isManualInput && <p className="text-xs text-gray-400 mt-1">*Nomor ini akan digunakan untuk login wali.</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hubungan</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Ayah Kandung, Ibu, Wali"
                      value={newOrtu.hubungan} 
                      onChange={e=>setNewOrtu({...newOrtu, hubungan:e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus // Langsung fokus ke sini kalau hasil search ketemu
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { if(!isEditing) setFormStep(1); else setShowOrtuModal(false); }} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">
                      {isEditing ? "Batal" : "Kembali"}
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300">
                      {saving ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Modal Password (Tetap ada, code disembunyikan biar pendek) */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg flex items-center"><Lock className="mr-2 text-blue-600" size={20} /> Ganti Kata Sandi</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label><input type="password" placeholder="Minimal 6 karakter" value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</label><input type="password" placeholder="Ulangi kata sandi baru" value={konfirmasiPassword} onChange={(e) => setKonfirmasiPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Batal</button><button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300">{saving ? "Menyimpan..." : "Simpan Password"}</button></div>
              </form>
            </div>
          </div>
      )}

    </div>
  );
}