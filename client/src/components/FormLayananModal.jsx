import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Lock, Loader2, Calendar, FileText, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function FormLayananModal({ isOpen, onClose, layanan, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" }); // Alert State

  // Reset form saat modal dibuka/ganti layanan
  useEffect(() => {
    if (isOpen) {
        setFormData({});
        setMessage({ type: "", text: "" });
    }
  }, [isOpen, layanan]);

  if (!isOpen || !layanan) return null;

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  // --- DEFINISI FORM DINAMIS (Sama seperti sebelumnya) ---
  const getFormConfig = (namaLayanan) => {
    const lowerName = namaLayanan.toLowerCase();

    if (lowerName.includes("izin bermalam")) {
        return [
            { name: "tanggal_keluar", label: "Tanggal Keluar", type: "date", icon: Calendar },
            { name: "tanggal_kembali", label: "Tanggal Kembali", type: "date", icon: Calendar },
            { name: "alasan", label: "Alasan", type: "textarea", placeholder: "Masukkan alasan izin...", icon: FileText },
            { name: "tujuan", label: "Tujuan", type: "text", placeholder: "Masukkan tujuan bermalam (Alamat/Kota)", icon: MapPin },
        ];
    } 
    else if (lowerName.includes("perbaikan")) {
        return [
            { name: "lokasi", label: "Lokasi Kerusakan", type: "text", placeholder: "Contoh: Kamar A1, Kamar Mandi Bawah", icon: MapPin },
            { name: "barang", label: "Barang/Fasilitas", type: "text", placeholder: "Contoh: Pintu Lemari, Keran Air", icon: FileText },
            { name: "deskripsi", label: "Deskripsi Kerusakan", type: "textarea", placeholder: "Jelaskan kondisi kerusakan...", icon: FileText },
        ];
    } 
    else if (lowerName.includes("pengadaan")) {
        return [
            { name: "lokasi", label: "Lokasi Kebutuhan", type: "text", placeholder: "Contoh: Kamar A1, Kamar Mandi Bawah", icon: MapPin },
            { name: "barang", label: "Barang/Fasilitas", type: "text", placeholder: "Contoh: Pintu Lemari, Keran Air", icon: FileText },
            { name: "deskripsi", label: "Deskripsi Alasan Kebutuhan", type: "textarea", placeholder: "Jelaskan alasan kebutuhan pengadaan barang/fasilitas...", icon: FileText },
        ];
    } 
    return [
        { name: "keterangan", label: "Keterangan / Keperluan", type: "textarea", placeholder: "Jelaskan keperluan pengajuan layanan ini...", icon: FileText },
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
        if (!formData[field.name]) {
            showAlert("error", `${field.label} wajib diisi`);
            return;
        }
    }

    setLoading(true);
    try {
        const token = localStorage.getItem("token");
        
        // Transform data
        const formattedData = formFields.map(field => ({
            label: field.label,
            value: formData[field.name]
        }));

        await axios.post('http://localhost:3000/api/santri/layanan/ajukan', {
            id_layanan: layanan.id,
            form_data: formattedData
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Callback sukses (untuk refresh data / redirect)
        if (onSuccess) onSuccess();
        onClose(); // Tutup modal

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
        
        {/* Alert Component */}
        {message.text && (
            <div className={`absolute top-4 left-4 right-4 z-[70] p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                <div className={`flex-shrink-0 p-1 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                </div>
                <p className="text-xs font-medium flex-1">{message.text}</p>
                <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
        )}

        {/* Header Modal */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Form Pengajuan</h2>
                <p className="text-xs text-gray-500 mt-0.5">Isi data yang diperlukan dengan benar</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition" disabled={loading}>
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
            
            {/* 1. Input Locked (Jenis Layanan) */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Layanan</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={layanan.nama_layanan} 
                        disabled 
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium text-sm"
                    />
                    <Lock className="absolute right-3 top-3 text-gray-400" size={18} />
                </div>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* 2. Input Dinamis */}
            {formFields.map((field) => {
                const Icon = field.icon;
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                        {field.type === 'textarea' ? (
                            <div className="relative">
                                <textarea 
                                    name={field.name}
                                    rows="3"
                                    placeholder={field.placeholder}
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 text-sm resize-none"
                                    onChange={handleChange}
                                    disabled={loading}
                                ></textarea>
                            </div>
                        ) : (
                            <div className="relative">
                                <input 
                                    type={field.type} 
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 text-sm"
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <Icon className="absolute left-3.5 top-3 text-gray-400" size={18} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Mengirim...
                    </>
                ) : (
                    <>
                        <Save className="mr-2" size={18} />
                        Ajukan Permintaan
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
}