import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { ArrowLeft, Search, Briefcase, History, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import DetailLayananModal from '../../components/DetailLayananModal'; 
import FormLayananModal from '../../components/FormLayananModal';
import AlertToast from "../../components/AlertToast";
import { useAlert } from "../../hooks/useAlert";

export default function LayananList() {
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { message, showAlert, clearAlert } = useAlert();
  
  // State untuk Modal
  const [selectedLayananDetail, setSelectedLayananDetail] = useState(null); 
  const [selectedLayananForm, setSelectedLayananForm] = useState(null); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLayanan();
  }, []);

  const fetchLayanan = async () => {
    try {
      const res = await api.get('/santri/layanan');
      setLayananList(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat daftar layanan");
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedLayananDetail(item);
  };

  const handleAjukanClick = (layanan) => {
    setSelectedLayananDetail(null); 
    setSelectedLayananForm(layanan);
  };

  const handleFormSuccess = () => {
    showAlert("success", "Pengajuan berhasil dikirim!");
    setTimeout(() => {
        navigate("/santri/layanan/riwayat"); 
    }, 1500);
  };

  const filteredList = layananList.filter(item => 
    item.nama_layanan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AlertToast message={message} onClose={clearAlert} />

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate("/santri")} 
                    className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Daftar Layanan</h1>
                    <p className="text-green-100 text-sm">Pusat bantuan dan perizinan santri</p>
                </div>
            </div>
            {/* Tombol History */}
            <button 
                onClick={() => navigate("/santri/layanan/riwayat")} 
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition text-sm font-medium backdrop-blur-sm"
            >
                <History size={18} />
                <span className="hidden sm:inline">Riwayat Pengajuan</span>
            </button>
          </div>

          {/* Search Bar Floating */}
          <div className="relative mt-6">
            <input 
                type="text" 
                placeholder="Cari layanan (misal: Izin Bermalam)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-800 bg-white/95 backdrop-blur shadow-lg border-0 focus:ring-2 focus:ring-green-300 outline-none transition placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        
        {loading ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                <Loader2 className="animate-spin h-8 w-8 text-green-500 mx-auto mb-2"/>
                <p className="text-gray-500">Memuat layanan...</p>
            </div>
        ) : (
            <div className="space-y-3">
                {filteredList.length > 0 ? (
                    filteredList.map((item) => (
                        <div 
                            key={item.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 flex-shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                    <Briefcase size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg truncate group-hover:text-green-600 transition">{item.nama_layanan}</h3>
                                    <p className="text-gray-500 text-sm truncate pr-4">{item.deskripsi || "Ketuk untuk melihat detail"}</p>
                                </div>
                            </div>
                            <div className="flex items-center text-green-600 font-medium text-sm whitespace-nowrap bg-green-50 px-3 py-1.5 rounded-lg group-hover:bg-green-100 transition">
                                Lihat Detail
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                        Tidak ada layanan ditemukan.
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- MODAL SECTION --- */}
      
      {/* 1. Modal Detail (Rincian) */}
      <DetailLayananModal 
        isOpen={!!selectedLayananDetail} 
        onClose={() => setSelectedLayananDetail(null)}
        layanan={selectedLayananDetail}
        onAjukan={handleAjukanClick} 
      />

      {/* 2. Modal Form (Input) */}
      <FormLayananModal 
        isOpen={!!selectedLayananForm}
        onClose={() => setSelectedLayananForm(null)}
        layanan={selectedLayananForm}
        onSuccess={handleFormSuccess}
      />

    </div>
  );
}