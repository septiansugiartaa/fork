import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from "lucide-react";
import CardMateri from "../../components/CardMateri";
import api from "../../config/api";

export default function MateriView() {
    const [materi, setMateri] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    
    const fetchMateri = async () => {
        setLoading(true);
        try {
            const res = await api.get("/global/viewMateri", {
                headers: { "Cache-Control": "no-cache" }
            });
            
            if (res.data.success) {
                setMateri(res.data.data.list_materi);
            } else {
                console.error(res.data.message);
                setMateri([]);
            }
        } catch (err) {
            console.error("Fetch error:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchMateri();
    }, []);

    const filteredMateri = materi.filter((item) =>
        item.judul.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Materi</h1>
                    <p className="text-gray-500 text-sm">Jendela Ilmu Pengetahuan Tentang Scabies</p>
                </div>
            </div>

            <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 outline-none transition-all">
                <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan judul materi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 text-gray-400 hover:text-gray-600 transition"
                            title="Hapus pencarian"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
                    <p className="text-gray-500">Memuat materi...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-10">
                    {filteredMateri.length > 0 ? (
                        filteredMateri.map((item) => (
                            <CardMateri 
                                key={item.id} 
                                materi={item} 
                                detailBasePath="/materi/detail" 
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center p-12 bg-white rounded-xl border border-gray-100 text-gray-500 shadow-sm">
                            Materi tidak ditemukan.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}