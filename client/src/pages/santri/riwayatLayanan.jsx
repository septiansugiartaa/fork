import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, Calendar, ChevronRight, Clock, CheckCircle, XCircle, Star, AlertTriangle, X, Loader2 } from 'lucide-react';
import DetailRiwayatLayananModal from '../../components/DetailRiwayatLayananModal';
import FeedbackModal from '../../components/FeedbackModal';

export default function RiwayatLayananList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Alert
  const [message, setMessage] = useState({ type: "", text: "" });

  // State Modals
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [feedbackItem, setFeedbackItem] = useState(null);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  const navigate = useNavigate();

  // --- SHOW ALERT HELPER ---
  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // --- FETCH DATA ---
  const fetchRiwayat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get('http://localhost:3000/api/santri/layanan/riwayat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat riwayat layanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // --- SUBMIT FEEDBACK ---
  const handleSubmitFeedback = async (idRiwayat, rating, review) => {
    setIsSavingFeedback(true);
    try {
        const token = localStorage.getItem("token");
        await axios.post('http://localhost:3000/api/santri/layanan/riwayat/feedback', {
            id_riwayat: idRiwayat,
            rating: rating,
            isi_text: review
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        showAlert("success", "Terima kasih atas ulasan Anda!");
        setFeedbackItem(null); // Tutup modal
        fetchRiwayat(); // Refresh data biar tombol feedback hilang
    } catch (err) {
        console.error(err);
        showAlert("error", "Gagal mengirim ulasan");
    } finally {
        setIsSavingFeedback(false);
    }
  };

  // --- STATUS HELPERS ---
  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('diterima')) return 'text-green-600 bg-green-50 border-green-100';
    if (s.includes('batal') || s.includes('tolak')) return 'text-red-600 bg-red-50 border-red-100';
    return 'text-yellow-600 bg-yellow-50 border-yellow-100';
  };

  const getStatusIcon = (status) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('diterima')) return <CheckCircle size={14} className="mr-1.5" />;
    if (s.includes('batal') || s.includes('tolak')) return <XCircle size={14} className="mr-1.5" />;
    return <Clock size={14} className="mr-1.5" />;
  };

  // Filter Search
  const filteredData = data.filter(item => 
    item.nama_layanan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* ALERT COMPONENT */}
      {message.text && (
        <div className={`fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-[11000] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-white border-red-500 text-red-700' : 'bg-white border-green-500 text-green-700'}`}>
          <div className={`flex-shrink-0 p-2 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
             {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      {/* Header Gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 pb-24 shadow-lg relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => navigate("/santri/layanan")} 
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold">Riwayat Pengajuan</h1>
                <p className="text-blue-100 text-sm">Status dan histori layanan anda</p>
            </div>
          </div>

          <div className="relative">
            <input 
                type="text" 
                placeholder="Cari riwayat..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-gray-800 bg-white/95 backdrop-blur shadow-lg border-0 focus:ring-2 focus:ring-blue-300 outline-none transition placeholder-gray-400"
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
                <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2"/>
                <p className="text-gray-500">Memuat riwayat...</p>
            </div>
        ) : (
            <div className="space-y-4">
                {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                        <div 
                            key={item.id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{item.nama_layanan}</h3>
                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                        <Calendar size={12} className="mr-1.5" />
                                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${getStatusColor(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                    <span className="capitalize">{item.status}</span>
                                </div>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-2">
                                <button 
                                    onClick={() => setSelectedDetailId(item.id)}
                                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition"
                                >
                                    Lihat Detail
                                </button>
                                
                                {/* Tombol Feedback: Hanya jika status Selesai & Belum ada feedback */}
                                {(item.status.toLowerCase().includes('selesai') || item.status.toLowerCase().includes('diterima')) && !item.sudah_feedback && (
                                    <button 
                                        onClick={() => setFeedbackItem(item)}
                                        className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition flex items-center justify-center"
                                    >
                                        <Star size={16} className="mr-2" />
                                        Beri Ulasan
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-2xl shadow-sm">
                        Tidak ada riwayat pengajuan.
                    </div>
                )}
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      <DetailRiwayatLayananModal 
        isOpen={!!selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
        idRiwayat={selectedDetailId}
      />

      <FeedbackModal 
        isOpen={!!feedbackItem}
        onClose={() => setFeedbackItem(null)}
        item={feedbackItem} // Mengirim item universal
        onSubmit={handleSubmitFeedback}
        saving={isSavingFeedback}
      />

    </div>
  );
}