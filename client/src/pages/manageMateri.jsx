import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X, 
  Plus
} from "lucide-react";
import CardMateri from "../components/CardMateri";
import CreateMateriModal from "../components/CreateMateriModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

export default function MateriManage (){
    const [materi, setMateri] = useState([]);
    const [search, setSearch] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [materiToEdit, setMateriToEdit] = useState(null)
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const fetchMateri = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const res = await fetch(
                    "http://localhost:3000/api/global/manageMateri",
                    {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }}
                );
                const result = await res.json();
                    if (result.success) {
                        setMateri(result.data.list_materi);
                    } else {
                        console.error(result.message);
                        setMateri([]);
                    }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

    useEffect(() => {
        fetchMateri();
    }, []);

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

    const handleConfirmDelete = async (id) => {
        try {
            setLoadingDelete(true)
            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:3000/api/global/manageMateri/${deleteId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            await fetchMateri(); 
            setShowDeleteModal(false);
            setDeleteId(null);
            console.log(deleteId)

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDelete(false);
        }
    };

    console.log("MATERI:", materi); 
    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate("/timkesehatan")}
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
            <div className="flex max-w-6xl mx-auto -mt-16 mb-8 px-4 gap-2.5">
                <div className="w-9/10 bg-white rounded-xl shadow-lg relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
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
                            className="absolute right-6 top-1/2 -translate-y-1/2
                                    text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className='w-1/10'>
                    <button className='h-full w-full flex justify-center items-center shadow-lg font-semibold bg-green-50 text-green-600 rounded-xl text-black hover:bg-green-500 hover:text-white transition duration-200 cursor-pointer' onClick={()=> setIsCreateOpen(true)}><Plus size={18} /> 
                    <span className="hidden md:inline">Buat</span></button>
                </div>
            </div>
            

            {/* DAFTAR MATERI */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4 pb-10">
               {filteredMateri.length > 0 ? (
                    filteredMateri.map((item) => (
                        <CardMateri 
                            key={item.id} 
                            materi={item} 
                            isManage={true}
                            detailBasePath="/timkesehatan/manageMateri"
                            onDelete={(id) => {
                                setDeleteId(id);
                                setShowDeleteModal(true);
                            }}
                            onEdit={(materi) => {
                                setMateriToEdit(materi);
                                setIsCreateOpen(true);
                            }}/>
                    ))
                    ) : (
                    <p className="col-span-full text-center text-gray-500">
                        Materi tidak ditemukan.
                    </p>
                )}
            </div>

            <CreateMateriModal
                isOpen={isCreateOpen}
                onClose={() =>{ 
                    setIsCreateOpen(false)
                    setMateriToEdit(null);
                }}
                refreshMateri={fetchMateri}
                materiToEdit={materiToEdit}
            />

            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                loading={loadingDelete}
            />
        </div>
    );
}

