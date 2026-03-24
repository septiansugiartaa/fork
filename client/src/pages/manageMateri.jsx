import { useState, useEffect } from 'react';
import api from '../config/api';
import { Search, Plus } from "lucide-react";
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
    
    const fetchMateri = async () => {
            try {
                setLoading(true);
                const res = await api.get("/global/manageMateri",);
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
            await api.delete(`/global/manageMateri/${deleteId}`);

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

    return (
        <div className="space-y-6">

            {/* Header Page */}
            <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manage Materi</h1>
                <p className="text-gray-500 text-sm">
                Kelola materi penyakit scabies
                </p>
            </div>

            <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition duration-200"
            >
                <Plus size={20} />
                <span className="ml-2 hidden md:inline">Tambah Materi</span>
            </button>
            </div>

            {/* Search Bar */}
            <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                    type="text"
                    placeholder="Cari judul materi..."
                    className="w-full pl-10 pr-4 py-2.5 outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Card Container */}
            <div className="bg-white">
            {filteredMateri.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMateri.map((item) => (
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
                    }}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                Materi tidak ditemukan.
                </div>
            )}
            </div>

            {/* Modal Create / Edit */}
            <CreateMateriModal
            isOpen={isCreateOpen}
            onClose={() => {
                setIsCreateOpen(false);
                setMateriToEdit(null);
            }}
            refreshMateri={fetchMateri}
            materiToEdit={materiToEdit}
            />

            {/* Confirm Delete */}
            <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            loading={loadingDelete}
            />
        </div>
    );
}

