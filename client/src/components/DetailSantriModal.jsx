import { X, User, Phone, MapPin, BookOpen, AlertCircle } from "lucide-react";

export default function DetailSantriModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header Profil */}
                <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center p-6 relative text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition">
                        <X size={20} />
                    </button>
                    <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 mb-3 shadow-lg">
                        <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {data.foto_profil && data.foto_profil !== '-' ? (
                                <img src={`http://localhost:3000/foto-profil/${data.foto_profil}`} className="w-full h-full object-cover" alt="Profil" />
                            ) : (
                                <User size={40} className="text-gray-400" />
                            )}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{data.nama}</h2>
                    <p className="text-green-100 text-sm">NIS: {data.nip}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Akademik & Asrama */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Akademik & Asrama</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-xs mb-1 flex items-center"><BookOpen size={12} className="mr-1"/> Kelas</p>
                                <p className="font-bold text-gray-800 text-sm">{data.kelas}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-xs mb-1 flex items-center"><MapPin size={12} className="mr-1"/> Kamar</p>
                                <p className="font-bold text-gray-800 text-sm">{data.kamar}</p>
                            </div>
                        </div>
                    </div>

                    {/* Kontak Darurat (Orang Tua/Wali) */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kontak Darurat (Orang Tua/Wali)</h3>
                        
                        {/* Cek apakah kontak_darurat ada dan merupakan array yang isinya lebih dari 0 */}
                        {data.kontak_darurat && data.kontak_darurat.length > 0 ? (
                            <div className="space-y-3">
                                {data.kontak_darurat.map((kontak, index) => (
                                    <div key={index} className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                            <Phone size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{kontak.nama}</p>
                                            <p className="text-sm text-gray-500 mb-2">{kontak.hubungan}</p>
                                            <a 
                                                href={`https://wa.me/${kontak.no_hp?.replace(/^0/, '62')}`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-block bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                            >
                                                Hubungi WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center text-gray-500 text-sm">
                                <AlertCircle size={16} className="mr-2"/> Belum ada data orang tua tertaut.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}