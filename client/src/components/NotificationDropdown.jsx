import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, CreditCard, Calendar, Clock, AlertTriangle, CheckCircle, List } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // 1. Ambil Role dari user yang login (misal dari string user di localStorage)
    const rawUser = localStorage.getItem('user');
    let userRole = 'santri'; // Default fallback
    if (rawUser) {
        try {
            const parsed = JSON.parse(rawUser);
            // Standarisasi role (misal dari "Orang Tua" jadi "orangtua")
            userRole = parsed.role.toLowerCase().replace(/\s/g, ''); 
        } catch (e) { console.error(e); }
    }

    const fetchNotifs = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // Memanggil endpoint berdasarkan rolenya
            const res = await axios.get(`http://localhost:3000/api/${userRole}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                setNotifs(res.data.data);
                setHasUnread(res.data.data.some(n => n.is_new));
            }
        } catch (err) { console.error("Gagal load notif", err); }
    };

    useEffect(() => {
        fetchNotifs();
        // Auto-refresh tiap 1 menit
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, [userRole]);

    // Handle klik di luar untuk menutup dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = async () => {
        const newState = !isOpen;
        setIsOpen(newState);
        
        // Jika dibuka dan ada yang unread, matikan titik merahnya ke database
        if (newState && hasUnread) {
            try {
                await axios.put(`http://localhost:3000/api/${userRole}/notifications/read`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setHasUnread(false);
                // Ubah state lokal agar border biru hilang
                setNotifs(notifs.map(n => ({...n, is_new: false})));
            } catch (e) { console.error(e); }
        }
    };

    const handleNotifClick = (urlTujuan) => {
        setIsOpen(false);
        if (urlTujuan) navigate(urlTujuan);
    };

    // Helper Ikon berdasarkan tipe notif
    const getNotifIcon = (tipe) => {
        switch(tipe) {
            case 'pengaduan': return <MessageSquare size={16} className="text-orange-500"/>;
            case 'keuangan': return <CreditCard size={16} className="text-green-500"/>;
            case 'kegiatan': return <Calendar size={16} className="text-blue-500"/>;
            case 'kesehatan': return <AlertTriangle size={16} className="text-red-500"/>;
            case 'layanan': return <List size={16} className="text-purple-500"/>;
            default: return <Bell size={16} className="text-gray-500"/>;
        }
    };

    const formatWaktu = (date) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMins < 1) return "Baru Saja";
        if (diffHrs < 1) return `${diffMins} menit yang lalu`;
        if (diffHrs < 24) return `${diffHrs} jam yang lalu`;
        if (diffDays === 1) return "Kemarin";
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition relative text-white">
                <Bell size={24} />
                {hasUnread && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 border-2 border-transparent rounded-full animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right duration-200">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                        {hasUnread && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Baru</span>}
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto">
                        {notifs.length > 0 ? notifs.map((n, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleNotifClick(n.url)}
                                className={`p-4 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition cursor-pointer ${n.is_new ? 'bg-blue-50/20 relative' : ''}`}
                            >
                                {/* Penanda Biru untuk Unread */}
                                {n.is_new && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                                
                                <div className="mt-1 w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    {getNotifIcon(n.tipe)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{n.judul}</p>
                                    <p className="text-xs text-gray-600 mt-0.5 leading-snug line-clamp-2">{n.pesan}</p>
                                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1 font-medium">
                                        <Clock size={10}/> {formatWaktu(n.waktu)}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                <CheckCircle className="text-green-200 mb-2" size={32} />
                                <p className="text-sm font-medium">Belum ada notifikasi</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}