import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2, Users, Calendar, DollarSign, CheckSquare, Search } from 'lucide-react';

export default function InputTagihanModal({ isOpen, onClose, isEditing, editData, onSubmit }) {
  const [formData, setFormData] = useState({
    nama_tagihan: "", id_jenis_tagihan: "", nominal: "", tanggal_tagihan: "", batas_pembayaran: ""
  });
  
  // State Select Santri (Gmail Style)
  const [allSantri, setAllSantri] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState([]); // Array of IDs
  const [searchTerm, setSearchTerm] = useState("");
  const [isSelectAll, setIsSelectAll] = useState(false);
  
  const [jenisOptions, setJenisOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Options saat modal buka
  useEffect(() => {
    if (isOpen) {
        fetchOptions();
        if (isEditing && editData) {
            setFormData({
                nama_tagihan: editData.nama_tagihan,
                id_jenis_tagihan: editData.id_jenis_tagihan,
                nominal: editData.nominal,
                tanggal_tagihan: editData.tanggal_tagihan ? editData.tanggal_tagihan.split('T')[0] : "",
                batas_pembayaran: editData.batas_pembayaran ? editData.batas_pembayaran.split('T')[0] : "",
            });
            // Mode edit: hanya single santri (read only name biasanya)
            setSelectedSantri([editData.id_santri]); 
        } else {
            setFormData({ nama_tagihan: "", id_jenis_tagihan: "", nominal: "", tanggal_tagihan: new Date().toISOString().split('T')[0], batas_pembayaran: "" });
            setSelectedSantri([]);
            setIsSelectAll(false);
        }
    }
  }, [isOpen, isEditing, editData]);

  const fetchOptions = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/api/pengurus/keuangan/options", { headers: { Authorization: `Bearer ${token}` }});
        setAllSantri(res.data.santri);
        setJenisOptions(res.data.jenis_tagihan);
    } catch (err) { console.error(err); }
  };

  // Logic Santri Selection
  const toggleSantri = (id) => {
    if (selectedSantri.includes(id)) {
        setSelectedSantri(selectedSantri.filter(s => s !== id));
    } else {
        setSelectedSantri([...selectedSantri, id]);
    }
  };

  const handleSelectAll = (e) => {
    setIsSelectAll(e.target.checked);
    if (e.target.checked) {
        setSelectedSantri([]); // Kalau All, array ID dikosongkan (backend handle 'all')
    } else {
        setSelectedSantri([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSelectAll && selectedSantri.length === 0) return alert("Pilih minimal satu santri");
    
    onSubmit({
        ...formData,
        target_santri: isSelectAll ? 'all' : selectedSantri // Kirim 'all' atau array ID
    });
  };

  // Filter santri for dropdown
  const filteredSantri = allSantri.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedSantri.includes(s.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><DollarSign className="text-green-600"/> {isEditing ? "Edit Tagihan" : "Buat Tagihan Baru"}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
            {/* Form Fields Basic */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Tagihan</label>
                    <select className="w-full p-2.5 border border-gray-200 rounded-xl bg-white" value={formData.id_jenis_tagihan} onChange={e => setFormData({...formData, id_jenis_tagihan: e.target.value})}>
                        <option value="" disabled>-- Pilih Jenis --</option>
                        {jenisOptions.map(j => <option key={j.id} value={j.id}>{j.jenis_tagihan}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tagihan</label>
                    <input type="text" className="w-full p-2.5 border border-gray-200 rounded-xl" placeholder="Contoh: SPP Januari" value={formData.nama_tagihan} onChange={e => setFormData({...formData, nama_tagihan: e.target.value})}/>
                </div>
            </div>

            {/* Input Nominal */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                <div className="relative">
                    <input type="number" className="w-full pl-9 p-2.5 border border-gray-200 rounded-xl" placeholder="0" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})}/>
                    <span className="absolute left-3 top-3 text-gray-500 text-sm font-bold">Rp</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Tagihan</label>
                    <input type="date" className="w-full p-2.5 border border-gray-200 rounded-xl" value={formData.tanggal_tagihan} onChange={e => setFormData({...formData, tanggal_tagihan: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                    <input type="date" className="w-full p-2.5 border border-gray-200 rounded-xl" value={formData.batas_pembayaran} onChange={e => setFormData({...formData, batas_pembayaran: e.target.value})}/>
                </div>
            </div>

            {/* Section Santri (Gmail Style) */}
            {!isEditing && (
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Pilih Santri (Target)</label>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="selectAll" checked={isSelectAll} onChange={handleSelectAll} className="w-4 h-4 text-green-600 rounded"/>
                            <label htmlFor="selectAll" className="text-sm text-gray-600">Pilih Semua Santri Aktif</label>
                        </div>
                    </div>

                    {!isSelectAll && (
                        <div className="border border-gray-200 rounded-xl p-2 bg-gray-50">
                            {/* Selected Chips */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedSantri.map(id => {
                                    const s = allSantri.find(x => x.id === id);
                                    return (
                                        <div key={id} className="bg-white border border-green-200 text-green-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1 shadow-sm">
                                            {s?.nama}
                                            <button onClick={() => toggleSantri(id)} className="hover:text-red-500"><X size={14}/></button>
                                        </div>
                                    )
                                })}
                            </div>
                            
                            {/* Search Input */}
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full p-2 pl-8 border-b border-transparent focus:border-green-500 outline-none bg-transparent text-sm"
                                    placeholder="Ketik nama santri..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-1 top-2 text-gray-400" size={16}/>
                                
                                {/* Dropdown Results */}
                                {searchTerm && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-lg rounded-xl mt-1 max-h-40 overflow-y-auto z-10">
                                        {filteredSantri.map(s => (
                                            <button key={s.id} onClick={() => { toggleSantri(s.id); setSearchTerm(""); }} className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm text-gray-700">
                                                {s.nama} <span className="text-xs text-gray-400">({s.nip})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {isSelectAll && (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-center text-green-700 text-sm font-medium">
                            <CheckSquare className="inline-block mr-2" size={16}/> Semua santri aktif akan menerima tagihan ini.
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100">Batal</button>
            <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 flex items-center">
                {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2"/>} Simpan
            </button>
        </div>
      </div>
    </div>
  );
}