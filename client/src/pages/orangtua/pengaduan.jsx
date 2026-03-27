// --- Pengaduan.jsx ---
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { ArrowLeft, User, Loader2, Plus, CheckCircle, Search, AlertTriangle, X } from 'lucide-react';
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";
import DetailPengaduanModal from '../../components/DetailPengaduanModal'; 
import CreatePengaduanModal from '../../components/CreatePengaduanModal';

const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
};

export default function OrangTuaPengaduan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { message, showAlert, clearAlert } = useAlert();
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const activeSantriId = localStorage.getItem('active_santri_id') || "";

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orangtua/pengaduan', {
          params: { id_santri: activeSantriId }
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data pengaduan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeSantriId]);

  const handleCreateSubmit = async (formData) => {
    setIsSaving(true);
    try {
        const res = await api.post("/orangtua/pengaduan/", formData);
        if (res.data.success) {
            showAlert("success", res.data.message);
            setIsCreateOpen(false);
            fetchData(); 
        }
    } catch (err) {
        showAlert("error", err.response?.data?.message || "Gagal membuat pengaduan");
    } finally {
        setIsSaving(false);
    }
  };

  const filteredData = data.filter(item => 
      item.judul.toLowerCase().includes(search.toLowerCase()) || 
      item.pelapor?.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 w-full overflow-x-hidden">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-40 shadow-lg relative md:pb-32">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/orangtua")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">Laporan Pengaduan Anak</h1>
              <p className="text-green-100 text-sm truncate">Daftar laporan terkait santri untuk didiskusikan</p>
            </div>
          </div>
          <button onClick={() => setIsCreateOpen(true)} className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold transition items-center shadow-md border border-orange-400">
            <Plus size={20} className="mr-2" /> Buat Laporan Baru
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10 md:-mt-24 space-y-4">
        <button onClick={() => setIsCreateOpen(true)} className="w-full md:hidden flex justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3.5 rounded-xl font-bold transition items-center shadow-lg">
            <Plus size={20} className="mr-2" /> Buat Laporan Baru
        </button>

        <div className="relative">
            <input type="text" placeholder="Cari laporan..." className="w-full bg-white pl-11 pr-4 py-3.5 rounded-xl shadow-sm border border-gray-100 text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Search className="absolute left-4 top-4.5 text-gray-400" size={20} />
        </div>

        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                <Loader2 className="animate-spin h-8 w-8 text-green-500 mx-auto mb-2"/>
                <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div key={item.id} onClick={() => setSelectedId(item.id)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div className="flex gap-4 items-start pl-2">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 overflow-hidden">
                      {item.pelapor?.foto ? <img src={`/foto-profil/${item.pelapor.foto}`} alt="ava" className="w-full h-full object-cover"/> : <User size={20} className="text-green-500" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                             <span className="font-semibold text-gray-700">{item.pelapor?.nama}</span><span>•</span><span>{formatTime(item.waktu)}</span>
                          </p>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-green-600 transition">{item.judul}</h3>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3 mt-1">{item.deskripsi}</p>
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50 mt-2">
                      <div className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-md ${item.status === 'Selesai' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`}>
                        {item.status || 'Aktif'}
                      </div>
                      {item.jumlah_tanggapan > 0 && <div className="text-xs text-gray-400 ml-auto">💬 {item.jumlah_tanggapan} Tanggapan</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
               <h3 className="text-lg font-bold text-gray-800">Tidak ada laporan</h3>
               <p className="text-gray-500 text-sm mt-1">Belum ada laporan yang masuk terkait anak Anda.</p>
            </div>
          )}
        </div>
      </div>

      {selectedId && <DetailPengaduanModal idAduan={selectedId} onClose={() => setSelectedId(null)} role="orangtua" />}
      <CreatePengaduanModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateSubmit} isSaving={isSaving} role="orangtua" activeSantriId={activeSantriId} />
    </div>
  );
}