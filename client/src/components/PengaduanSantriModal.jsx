import { X, AlertTriangle, ShieldAlert, Calendar } from "lucide-react";

export default function PengaduanSantriModal({ isOpen, onClose, dataSantri, riwayatPengaduan, loading }) {
    if (!isOpen || !dataSantri) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg flex items-center">
                            <ShieldAlert size={20} className="mr-2 text-orange-500" /> Riwayat Pengaduan
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Laporan Anda untuk: <span className="font-bold text-gray-700">{dataSantri.nama}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition p-2 bg-white rounded-full shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-gray-50/50">
                    {loading ? (
                        <p className="text-center text-gray-500 text-sm py-10 animate-pulse">Memuat riwayat pengaduan...</p>
                    ) : riwayatPengaduan.length > 0 ? (
                        <div className="space-y-4">
                            {riwayatPengaduan.map((item) => (
                                <div key={item.id} className="bg-white p-4 border border-gray-200 rounded-2xl shadow-sm relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${item.status === 'Selesai' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <h4 className="font-bold text-gray-800 text-sm">{item.judul}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-xs pl-2 mb-3 leading-relaxed">{item.deskripsi}</p>
                                    <p className="text-gray-400 text-[10px] pl-2 flex items-center">
                                        <Calendar size={10} className="mr-1"/>Dilaporkan pada: {item.tanggal}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium text-sm">Belum ada laporan pengaduan</p>
                            <p className="text-gray-400 text-xs mt-1">Anda belum pernah melaporkan santri ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}