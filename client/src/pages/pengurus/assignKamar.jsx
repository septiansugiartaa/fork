import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Search, Edit2, Trash2, Home, Loader2, AlertTriangle, CheckCircle, X } from "lucide-react";
import AssignKamarModal from "../../components/AssignKamarModal";

export default function DataAssignKamar() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/pengurus/assign-kamar";

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}?search=${search}`, { headers: { Authorization: `Bearer ${token}` } });
      setDataList(res.data.data);
    } catch (err) { showAlert("error", "Gagal memuat data kamar"); } finally { setLoading(false); }
  };

  useEffect(() => { const delay = setTimeout(fetchData, 500); return () => clearTimeout(delay); }, [search]);

  const handleSubmit = async (formData) => {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${selectedData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Data kamar diperbarui");
      } else {
        await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
        showAlert("success", "Santri berhasil masuk kamar");
      }
      setIsModalOpen(false); fetchData();
    } catch (err) { showAlert("error", "Gagal menyimpan data"); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Keluarkan santri dari kamar ini?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showAlert("success", "Santri dikeluarkan"); fetchData();
    } catch (err) { showAlert("error", "Gagal menghapus data"); }
  };

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[11000] min-w-[320px] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Penempatan Kamar</h1><p className="text-gray-500 text-sm">Atur penempatan kamar santri</p></div>
        <button onClick={() => { setIsEditing(false); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition"><Plus size={20} className="mr-2" /> Assign Kamar</button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><div className="relative"><input type="text" placeholder="Cari nama santri..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={(e) => setSearch(e.target.value)}/><Search className="absolute left-3 top-3 text-gray-400" size={18} /></div></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={32}/><p>Memuat data...</p></div> : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase"><th className="p-4">Santri</th><th className="p-4">Kamar</th><th className="p-4">Lokasi</th><th className="p-4">Masuk</th><th className="p-4 text-center">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {dataList.length > 0 ? dataList.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 font-semibold text-gray-800">{item.users.nama}</td>
                                <td className="p-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{item.kamar.kamar}</span></td>
                                <td className="p-4 text-gray-600">{item.kamar.lokasi}</td>
                                <td className="p-4 text-gray-600">{new Date(item.tanggal_masuk).toLocaleDateString('id-ID')}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                    <button onClick={() => { setIsEditing(true); setSelectedData(item); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        )) : <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data tidak ditemukan.</td></tr>}
                    </tbody>
                </table>
            </div>
        )}
      </div>
      <AssignKamarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isEditing={isEditing} editData={selectedData} onSubmit={handleSubmit} saving={isSaving} />
    </div>
  );
}