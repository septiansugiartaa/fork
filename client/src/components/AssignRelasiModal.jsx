import { useState, useEffect } from "react";
import { User, X, Search, Loader2, CheckCircle, Plus, AlertTriangle, Users } from "lucide-react";
import api from "../config/api"; 
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

// mode: 'ortu' (Cari Ortu untuk Santri) ATAU 'santri' (Cari Santri untuk Ortu)
export default function AssignRelasiModal({ isOpen, onClose, mode, baseData, onSubmit, saving }) {
  const [formStep, setFormStep] = useState(1);
  const [isManualInput, setIsManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();

  const [formData, setFormData] = useState({
    id_selected: null, // ID hasil pencarian
    nama: "",
    no_hp: "",
    hubungan: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ id_selected: null, nama: "", no_hp: "", hubungan: "" });
      setSearchQuery("");
      setSearchResults([]);
      setFormStep(1);
      setIsManualInput(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (formStep === 1 && searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const targetRole = mode === 'ortu' ? 'orangtua' : 'santri';
          const res = await api.get(`/admin/orangtua/search?role=${targetRole}&q=${searchQuery}`);
          if (res.data.success) setSearchResults(res.data.data);
        } catch (err) {
          console.error("Search error", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, formStep, mode]);

  const handleSelectUser = (user) => {
    setFormData({ id_selected: user.id, nama: user.nama, no_hp: user.no_hp || user.nip, hubungan: "" });
    setIsManualInput(false); 
    setFormStep(2);
  };

  const handleManualInput = () => {
    setFormData({ id_selected: null, nama: searchQuery, no_hp: "", hubungan: "" });
    setIsManualInput(true);
    setFormStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isManualInput && (!formData.nama || !formData.no_hp)) {
      return showAlert("error", "Nama dan No HP wajib diisi untuk akun baru");
    }
    
    if (!formData.hubungan) return showAlert("error", "Hubungan wajib diisi");

    // Susun payload sesuai Controller
    const payload = {
        hubungan: formData.hubungan,
        isManualInput: isManualInput
    };

    if (mode === 'ortu') {
        payload.id_santri = baseData.id;
        payload.id_orangtua = formData.id_selected;
    } else {
        payload.id_orangtua = baseData.id;
        payload.id_santri = formData.id_selected;
    }

    if (isManualInput) {
        payload.ortuDataBaru = { nama: formData.nama, no_hp: formData.no_hp };
    }

    onSubmit(payload);
  };

  if (!isOpen) return null;

  const isCariOrtu = mode === 'ortu';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <AlertToast message={message} onClose={clearAlert} />

        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                {isCariOrtu ? <Users className="text-green-600" size={20} /> : <User className="text-green-600" size={20} />}
                {isCariOrtu ? "Hubungkan ke Orang Tua" : "Hubungkan ke Anak"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                Target: <strong>{baseData?.nama}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
        </div>

        <div className="p-6">
          {/* STEP 1: SEARCH */}
          {formStep === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={isCariOrtu ? "Cari Nama / No HP Wali..." : "Cari Nama / NIS Santri..."}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                {isSearching && <Loader2 className="absolute right-3 top-3.5 text-green-500 animate-spin" size={20} />}
              </div>

              <div className="space-y-2 h-48 overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-green-300 hover:bg-green-50 transition flex justify-between items-center group">
                      <div>
                        <p className="font-semibold text-gray-800">{user.nama}</p>
                        <p className="text-xs text-gray-500">{isCariOrtu ? `No HP: ${user.no_hp}` : `NIS: ${user.nip}`}</p>
                      </div>
                      <div className="text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition">Pilih</div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-gray-400">
                    {searchQuery.length < 3 ? "Ketik minimal 3 karakter..." : "Data tidak ditemukan."}
                  </div>
                )}
              </div>

              {/* Input Manual HANYA untuk buat akun Wali baru, jangan buat Santri asal-asalan */}
              {isCariOrtu && (
                  <div className="pt-2 border-t border-gray-100">
                    <button onClick={handleManualInput} className="w-full flex items-center justify-center p-3 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition">
                      <Plus size={16} className="mr-2" /> Input Manual Wali Baru
                    </button>
                  </div>
              )}
            </div>
          )}

          {/* STEP 2: FORM HUBUNGAN */}
          {formStep === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isManualInput && (
                <div className="bg-green-50 p-3 rounded-lg flex items-start gap-3 mb-2">
                  <CheckCircle className="text-green-600 mt-0.5" size={18} />
                  <div className="text-sm text-green-800">
                    <p className="font-bold">Data Ditemukan!</p>
                    <p className="text-xs mt-1">Silakan tentukan status hubungan keluarga.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama {isCariOrtu ? 'Wali' : 'Anak'}</label>
                <input type="text" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} disabled={!isManualInput} className={`w-full p-3 border border-gray-200 rounded-xl outline-none ${!isManualInput ? "bg-gray-100 text-gray-500" : "focus:ring-2 focus:ring-green-500"}`} />
              </div>

              {/* No HP Hanya Diminta kalau buat Wali Baru */}
              {(isManualInput || isCariOrtu) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. HP (WhatsApp)</label>
                    <input type="text" value={formData.no_hp} onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })} disabled={!isManualInput} className={`w-full p-3 border border-gray-200 rounded-xl outline-none ${!isManualInput ? "bg-gray-100 text-gray-500" : "focus:ring-2 focus:ring-green-500"}`} />
                  </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hubungan</label>
                <input type="text" placeholder="Contoh: Ayah Kandung, Ibu, Wali" value={formData.hubungan} onChange={(e) => setFormData({ ...formData, hubungan: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" autoFocus />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormStep(1)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition">Kembali</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex justify-center items-center">
                  {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : "Simpan Relasi"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}