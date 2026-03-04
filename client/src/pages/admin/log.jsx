import React, { useState, useEffect } from "react";
import api from "../../config/api";
import { Search, Loader2, Activity, Clock, Filter, X } from "lucide-react";
import Pagination from "../../components/pagination/Pagination";

const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
};

const formatEntitas = (string) => {
    if (!string) return "";
    return string.replace(/-/g, ' ');
};

export default function Log() {
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ totalPages: 0, currentPage: 1 });

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(""); 
    const [filterAksi, setFilterAksi] = useState("Semua");
    const [filterRole, setFilterRole] = useState("Semua");
    const [availableRoles, setAvailableRoles] = useState([]);
    
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await api.get("/admin/log/roles");
                if (res.data.success) setAvailableRoles(res.data.data);
            } catch (err) { 
                console.error("Gagal mengambil daftar role:", err.response?.data?.message || err.message); 
            }
        };
        fetchRoles();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filterAksi, filterRole]);

    useEffect(() => {
        fetchLogs();
    }, [debouncedSearch, filterAksi, filterRole, currentPage]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/log", {
                params: {
                    page: currentPage,
                    limit: 15,
                    search: debouncedSearch,
                    aksi: filterAksi,
                    role: filterRole
                }
            });
            
            if (res.data.success) {
                setDataList(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (err) {
            console.error("Gagal memuat log:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Log Aktivitas</h1>
                        <p className="text-gray-500 text-sm">Pantau seluruh rekam jejak aktivitas manipulasi data di dalam sistem</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all outline-none">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari (Nama, aksi, role, dll)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <select value={filterAksi} onChange={(e) => setFilterAksi(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer outline-none">
                            <option value="Semua">Semua Aksi</option>
                            <option value="CREATE">CREATE (Tambah)</option>
                            <option value="UPDATE">UPDATE (Ubah)</option>
                            <option value="DELETE">DELETE (Hapus)</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    <div className="relative">
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer capitalize outline-none">
                            <option value="Semua">Semua Role</option>
                            {availableRoles.map(role => (
                                <option key={role} value={role} className="capitalize">{role}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-green-600 mb-2" size={32}/>
                        <span className="text-gray-500 text-sm">Menarik data forensik dari server...</span>
                    </div>
                ) : dataList.length > 0 ? (
                    <div className="">
                        {dataList.map((log) => (
                            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl border-b border-gray-100 transition">
                                <div className="mt-0.5">
                                    <span className={`px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider flex justify-center w-[75px] shadow-sm
                                        ${log.aksi === 'CREATE' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                          log.aksi === 'UPDATE' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                                          log.aksi === 'DELETE' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                          'bg-gray-100 text-gray-700 border border-gray-200'}`}
                                    >
                                        {log.aksi}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">{formatEntitas(log.keterangan)}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                            <span className="font-bold capitalize">{log.role_user}</span>
                                        </div>
                                        <span>•</span>
                                        <span className="capitalize tracking-wider font-medium text-gray-600">Data {formatEntitas(log.entitas)}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-gray-400"><Clock size={12}/> {formatDateTime(log.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Activity size={40} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-bold text-gray-700">Data Tidak Ditemukan</h3>
                        <p className="text-sm text-gray-500 mt-1">Tidak ada log aktivitas yang cocok dengan pencarian.</p>
                    </div>
                )}
            </div>

            {meta.totalPages > 1 && !loading && (
                <Pagination
                    currentPage={meta.currentPage}
                    totalPages={meta.totalPages}
                    onNext={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                    onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
                />
            )}
        </div>
    );
}