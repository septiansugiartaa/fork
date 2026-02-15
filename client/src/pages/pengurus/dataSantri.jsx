import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Search, Edit2, Trash2, User, Loader2, Mail, Phone, 
  AlertTriangle, CheckCircle, X 
} from "lucide-react";
import InputSantriModal from "../../components/InputSantriModal";

export default function DataSantri() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // State Alert Inline
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/santri";

  // Helper Alert
  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // 1. Fetch Data
  const fetchSantri = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSantriList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data santri");
    } finally {
      setLoading(false);
    }
  };

  // Fetch saat mount atau search berubah
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
        fetchSantri();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // 2. Handlers Modal
  const handleAdd = () => {
    setIsEditing(false);
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (data) => {
    setIsEditing(true);
    setSelectedData(data);
    setIsModalOpen(true);
  };

  // 3. Submit Handler (Create/Update)
  const handleSubmit = async (formData) => {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      if (isEditing) {
        // Update
        await axios.put(`${API_URL}/${selectedData.id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showAlert("success", "Data santri berhasil diperbarui");
      } else {
        // Create
        await axios.post(API_URL, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        showAlert("success", "Santri baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchSantri(); // Refresh table
    } catch (err) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan santri ini?")) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("success", "Santri berhasil dinonaktifkan");
      fetchSantri();
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6 relative">
        
      {/* --- ALERT INLINE UI --- */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[11000] min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
            {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Santri</h1>
          <p className="text-gray-500 text-sm">Kelola data seluruh santri aktif</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg hover:shadow-blue-500/30 transition">
            <Plus size={20} className="mr-2" /> Tambah Santri
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input type="text" placeholder="Cari nama atau NIS..." className="w-full pl-10 pr-4 py-2.5 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nama & NIS</th>
                  <th className="p-4 font-semibold">Kontak</th>
                  <th className="p-4 font-semibold">Alamat</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {santriList.length > 0 ? (
                  santriList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                            {item.foto_profil ? (
                              <img src={`http://localhost:3000/uploads/${item.foto_profil}`} alt={item.nama} className="w-full h-full object-cover"/>
                            ) : (
                              <span className="text-blue-600 font-bold text-sm bg-blue-100 w-full h-full flex items-center justify-center">
                                {item.nama.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {/* Fallback inisial jika gambar error (hidden by default jika img sukses) */}
                            {item.foto_profil && (
                              <span className="text-blue-600 font-bold text-sm bg-blue-100 w-full h-full flex items-center justify-center hidden">
                                {item.nama.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{item.nama}</p>
                            <p className="text-xs text-gray-500">NIS: {item.nip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail size={14} /> {item.email || "-"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} /> {item.no_hp || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.alamat || "-"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus (Nonaktifkan)">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      Data santri tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <InputSantriModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        editData={selectedData}
        onSubmit={handleSubmit}
        saving={isSaving}
      />

    </div>
  );
}