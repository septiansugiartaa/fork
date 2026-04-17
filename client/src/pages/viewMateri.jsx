import { useState, useEffect } from 'react';
import api from '../config/api';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X, 
} from "lucide-react";
import CardMateri from "../components/CardMateri";

const LEGACY_RECENT_STORAGE_KEY = "santri_recent_materi";

export default function MateriView (){
    const [materi, setMateri] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const isPublicMateriPage = location.pathname.startsWith("/materi");
    const rootFrom = location.state?.rootFrom || location.state?.from || (isPublicMateriPage ? "/" : "/santri");
    const backPath = rootFrom;
    const detailBasePath = isPublicMateriPage ? "/materi" : "/santri/scabies/viewMateri";
    
    const fetchMateri = async () => {
        try {
            setLoading(true);
            const endpoint = isPublicMateriPage ? "/public/materi" : "/global/viewMateri";
            const res = await api.get(endpoint);
                if (res.data.success) {
                    setMateri(res.data.data.list_materi);
                } else {
                    console.error(res.data.message);
                    setMateri([]);
                }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        localStorage.removeItem(LEGACY_RECENT_STORAGE_KEY);
        fetchMateri();
    }, [isPublicMateriPage]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">
                    Memuat data...
                    </p>
                </div>
            </div>
        );
    }

    const filteredMateri = materi.filter((item) =>
        item.judul.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(backPath)}
                        className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold truncate">Daftar Materi</h1>
                        <p className="text-green-100 text-sm truncate">
                        Jendela Ilmu Pengetahuan Tentang Scabies
                        </p>
                    </div>
                </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="max-w-6xl mx-auto -mt-16 mb-8 px-4">
                <div className="bg-white rounded-2xl relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan judul materi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 rounded-xl
                                    focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                    text-gray-400 hover:text-gray-600 transition"
                        >
                        <X size={18} />
                        </button>
                    )}
                </div>
            </div>
            

            {/* DAFTAR MATERI */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4 pb-10">
               {filteredMateri.length > 0 ? (
                    filteredMateri.map((item) => (
                        <CardMateri
                            key={item.id}
                            materi={item}
                            detailBasePath={detailBasePath}
                            fromPath={location.pathname}
                            rootFrom={rootFrom}
                        />
                    ))
                    ) : (
                    <p className="col-span-full text-center text-gray-500">
                        Materi tidak ditemukan.
                    </p>
                )}
            </div>
        </div>
    );
}
