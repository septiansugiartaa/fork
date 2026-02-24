import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Lock, Loader2, Calendar, FileText, MapPin, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';

export default function FormLayananModal({ isOpen, onClose, layanan, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [userContext, setUserContext] = useState({ kamar: '', kelas: '' }); // Data Kamar & Kelas Santri
  const [locationType, setLocationType] = useState(""); // State dropdown lokasi
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_URL = "http://localhost:3000/api/santri";

  // 1. Reset & Fetch Context saat Modal Buka
  useEffect(() => {
    if (isOpen) {
        setFormData({});
        setMessage({ type: "", text: "" });
        setLocationType(""); 
        fetchUserContext();
    }
  }, [isOpen, layanan]);

  const fetchUserContext = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/layanan/context`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUserContext(res.data.data);
    } catch (err) {
        console.error("Gagal ambil data kamar/kelas", err);
    }
  };

  if (!isOpen || !layanan) return null;

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // --- LOGIC HANDLE LOCATIONS ---
  const handleLocationTypeChange = (e) => {
      const type = e.target.value;
      setLocationType(type);

      // Otomatis isi formData berdasarkan pilihan
      if (type === 'kamar') {
          setFormData(prev => ({ ...prev, lokasi: userContext.kamar || "Belum ada kamar" }));
      } else if (type === 'kelas') {
          setFormData(prev => ({ ...prev, lokasi: userContext.kelas || "Belum ada kelas" }));
      } else {
          // Jika 'Lainnya', kosongkan agar user mengetik manual
          setFormData(prev => ({ ...prev, lokasi: "" }));
      }
  };

  // --- KONFIGURASI FORM ---
  const getFormConfig = (namaLayanan) => {
    const lowerName = namaLayanan.toLowerCase();

    // Logic Khusus Pengadaan & Perbaikan (Dropdown Lokasi)
    if (lowerName.includes("perbaikan") || lowerName.includes("pengadaan")) {
        return [
            { 
                name: "lokasi", 
                label: "Lokasi Kebutuhan", 
                type: "location_dropdown", // Tipe Khusus
                icon: MapPin 
            },
            { name: "barang", label: "Barang/Fasilitas", type: "text", placeholder: "Contoh: Pintu Lemari, Keran Air", icon: FileText },
            { name: "deskripsi", label: "Deskripsi/Alasan", type: "textarea", placeholder: "Jelaskan detail kebutuhan...", icon: FileText },
        ];
    } 
    else if (lowerName.includes("izin bermalam")) {
        return [
            { name: "tanggal_keluar", label: "Tanggal Keluar", type: "date", icon: Calendar },
            { name: "tanggal_kembali", label: "Tanggal Kembali", type: "date", icon: Calendar },
            { name: "alasan", label: "Alasan", type: "textarea", placeholder: "Masukkan alasan izin...", icon: FileText },
            { name: "tujuan", label: "Tujuan", type: "text", placeholder: "Alamat tujuan...", icon: MapPin },
        ];
    }
    return [
        { name: "keterangan", label: "Keterangan / Keperluan", type: "textarea", placeholder: "Jelaskan keperluan...", icon: FileText },
    ];
  };

  const formFields = getFormConfig(layanan.nama_layanan);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validasi
    for (let field of formFields) {
        // Khusus lokasi, cek apakah dropdown sudah dipilih
        if (field.type === 'location_dropdown' && !locationType) {
            showAlert("error", "Pilih jenis lokasi terlebih dahulu");
            return;
        }
        if (!formData[field.name]) {
            showAlert("error", `${field.label} wajib diisi`);
            return;
        }
    }

    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        
        const formattedData = formFields.map(field => ({
            label: field.label,
            value: formData[field.name]
        }));

        await axios.post(`${API_URL}/layanan/ajukan`, {
            id_layanan: layanan.id,
            form_data: formattedData
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (onSuccess) onSuccess();
        onClose(); 

    } catch (err) {
        console.error(err);
        showAlert("error", "Gagal mengirim pengajuan. Coba lagi.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] relative">
        
        {/* Alert */}
        {message.text && (
            <div className={`absolute top-4 left-4 right-4 z-[70] p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                <p className="text-xs font-medium flex-1">{message.text}</p>
                <button onClick={() => setMessage({type:"", text:""})}><X size={16} /></button>
            </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Pengajuan {layanan.nama_layanan}</h2>
            </div>
            <button onClick={onClose} disabled={loading} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
            {formFields.map((field) => {
                const Icon = field.icon;
                
                // RENDER KHUSUS: Location Dropdown
                if (field.type === 'location_dropdown') {
                    return (
                        <div key={field.name} className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">{field.label}</label>
                            
                            {/* Dropdown Pilihan */}
                            <div className="relative">
                                <select 
                                    value={locationType} 
                                    onChange={handleLocationTypeChange}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none appearance-none text-sm text-gray-700"
                                >
                                    <option value="" disabled>-- Pilih Area --</option>
                                    <option value="kamar">Kamar</option>
                                    <option value="kelas">Kelas</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                                <Icon className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                <ChevronDown className="absolute right-3.5 top-3.5 text-gray-400" size={16} />
                            </div>

                            {/* Input Result (Disabled jika Kamar/Kelas, Enabled jika Lainnya) */}
                            {locationType && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <input 
                                        type="text"
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        placeholder="Ketik detail lokasi..."
                                        disabled={locationType !== 'lainnya'} // Locked jika bukan lainnya
                                        className={`w-full pl-4 pr-4 py-3 border rounded-xl outline-none text-sm transition ${locationType !== 'lainnya' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white border-gray-200 focus:ring-2 focus:ring-green-500'}`}
                                    />
                                    {locationType !== 'lainnya' && (
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">*Lokasi terisi otomatis sesuai data Anda</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }

                // RENDER STANDARD
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                        <div className="relative">
                            {field.type === 'textarea' ? (
                                <textarea 
                                    name={field.name}
                                    rows="3"
                                    placeholder={field.placeholder}
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            ) : (
                                <>
                                    <input 
                                        type={field.type} 
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <Icon className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center disabled:opacity-70"
            >
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                {loading ? "Mengirim..." : "Ajukan Permintaan"}
            </button>
        </div>

      </div>
    </div>
  );
}