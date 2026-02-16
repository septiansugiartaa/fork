import { useState, useEffect } from "react";
import { User, X, Search, Loader2, CheckCircle, Plus, AlertTriangle } from "lucide-react";

export default function OrtuModal({
  isOpen,
  onClose,
  api,
  isEditing,
  editData,
  onSubmit,
  saving,
}) {
  // State Internal Modal
  const [formStep, setFormStep] = useState(1);
  const [isManualInput, setIsManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" }); // Alert State

  // Data Form
  const [formData, setFormData] = useState({
    nama: "",
    hubungan: "",
    no_hp: "",
    id_user_wali: null,
  });

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // Reset atau Isi Data saat Modal Dibuka/Edit Data Berubah
  useEffect(() => {
    if (isOpen) {
      if (isEditing && editData) {
        setFormData({
          nama: editData.nama,
          hubungan: editData.hubungan,
          no_hp: editData.no_hp,
          id_user_wali: editData.id_user_wali, 
        });
        setFormStep(2);
        setIsManualInput(true);
      } else {
        setFormData({ nama: "", hubungan: "", no_hp: "", id_user_wali: null });
        setSearchQuery("");
        setSearchResults([]);
        setFormStep(1);
        setIsManualInput(false);
      }
      setMessage({ type: "", text: "" });
    }
  }, [isOpen, isEditing, editData]);

  // Logika Search (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!isEditing && formStep === 1 && searchQuery.length >= 3) {
        setIsSearchingUser(true);
        try {
          const res = await api.get(`/orangtua/search?q=${searchQuery}`);
          if (res.data.success) {
            setSearchResults(res.data.data);
          }
        } catch (err) {
          console.error("Search error", err);
        } finally {
          setIsSearchingUser(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, formStep, isEditing, api]);

  // Handlers
  const handleSelectUser = (user) => {
    setFormData({
      nama: user.nama,
      no_hp: user.no_hp,
      hubungan: "",
      id_user_wali: user.id,
    });
    setIsManualInput(false); // Readonly mode
    setFormStep(2);
  };

  const handleManualInput = () => {
    setFormData({ ...formData, nama: searchQuery, id_user_wali: null });
    setIsManualInput(true);
    setFormStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.hubungan || !formData.no_hp) {
      showAlert("error", "Semua field wajib diisi");
      return;
    }
    // Kirim data ke Parent Component
    onSubmit(formData, isManualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative">
        
        {/* Alert Component */}
        {message.text && (
            <div className={`absolute top-4 left-4 right-4 z-[60] p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                <div className={`flex-shrink-0 p-1 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                </div>
                <p className="text-xs font-medium flex-1">{message.text}</p>
                <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center">
            <User className="mr-2 text-blue-600" size={20} />
            {isEditing ? "Edit Data Wali" : "Tambah Data Wali"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* STEP 1: SEARCH UI */}
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
                <Search
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={20}
                />
                {isSearchingUser && (
                  <Loader2
                    className="absolute right-3 top-3.5 text-blue-500 animate-spin"
                    size={20}
                  />
                )}
              </div>

              {/* Hasil Search */}
              <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.nama}
                        </p>
                        <p className="text-xs text-gray-500">{user.no_hp}</p>
                      </div>
                      <div className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                        Pilih
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    {isSearchingUser ? (
                      <p className="text-sm text-gray-500">Mencari data...</p>
                    ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
                      <p className="text-sm text-gray-400">
                        Ketik minimal 3 karakter...
                      </p>
                    ) : searchQuery.length >= 3 ? (
                      <p className="text-sm text-gray-500">
                        Data tidak ditemukan.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Silakan cari data wali yang sudah terdaftar.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Tombol Input Manual (Selalu Muncul) */}
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

          {/* STEP 2: FORM UI */}
          {formStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isEditing && !isManualInput && (
                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 mb-2">
                  <CheckCircle
                    className="text-blue-600 flex-shrink-0 mt-0.5"
                    size={18}
                  />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold">Data Ditemukan!</p>
                    <p className="text-xs mt-1">
                      Akun wali sudah ada. Silakan isi hubungan keluarga saja.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  disabled={!isManualInput && !isEditing}
                  className={`w-full p-3 border rounded-xl outline-none ${!isManualInput && !isEditing ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor HP (Login)
                </label>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) =>
                    setFormData({ ...formData, no_hp: e.target.value })
                  }
                  disabled={!isManualInput && !isEditing}
                  className={`w-full p-3 border rounded-xl outline-none ${!isManualInput && !isEditing ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500"}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hubungan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ayah Kandung, Ibu, Wali"
                  value={formData.hubungan}
                  onChange={(e) =>
                    setFormData({ ...formData, hubungan: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) setFormStep(1);
                    else onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                >
                  {isEditing ? "Batal" : "Kembali"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300 flex justify-center items-center"
                >
                  {saving && (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}