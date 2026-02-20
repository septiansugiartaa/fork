import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import DetailPengaduanModal from '../../components/DetailPengaduanModal'; 

const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
  });
};

export default function OrangTuaPengaduan() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        // API Endpoint Orang Tua
        const res = await axios.get('http://localhost:3000/api/orangtua/pengaduan', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="bg-gradient-to-br from-indigo-600 to-blue-500 text-white p-6 pb-24 shadow-lg relative">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/orangtua")} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Laporan Pengaduan Anak</h1>
            <p className="text-blue-100 text-sm">Daftar laporan terkait santri untuk didiskusikan</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2"/>
                <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : data.length > 0 ? (
            data.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedId(item.id)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                <div className="flex gap-4 items-start pl-2">
                  <div className="flex-shrink-0 pt-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 overflow-hidden">
                      {item.pelapor.foto ? (
                          <img src={`http://localhost:3000/foto-profil/${item.pelapor.foto}`} alt="ava" className="w-full h-full object-cover"/>
                      ) : (
                          <User size={20} className="text-blue-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                             <span className="font-semibold text-gray-700">{item.pelapor.nama}</span>
                             <span>•</span>
                             <span>{formatTime(item.waktu)}</span>
                          </p>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition">
                            {item.judul}
                          </h3>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3 mt-1">
                      {item.deskripsi}
                    </p>

                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50 mt-2">
                      <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md ${item.status === 'Selesai' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50'}`}>
                        {item.status || 'Aktif'}
                      </div>
                      {item.jumlah_tanggapan > 0 && (
                        <div className="text-xs text-gray-400 ml-auto">
                            {item.jumlah_tanggapan} Tanggapan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
               </div>
               <h3 className="text-lg font-bold text-gray-800">Tidak ada laporan</h3>
               <p className="text-gray-500 text-sm">Alhamdulillah, belum ada laporan yang masuk terkait anak Anda.</p>
            </div>
          )}
        </div>
      </div>

      {selectedId && (
        <DetailPengaduanModal 
          idAduan={selectedId} 
          onClose={() => setSelectedId(null)} 
        />
      )}
    </div>
  );
}