import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, UserCheck, Home, Bell, CreditCard, ArrowUpRight, 
  Clock, CheckCircle, ChevronRight, Loader2, Info, User
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPiutangList, setShowPiutangList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/pengurus/dashboard/stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setData(res.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  const { stats, chartData, recentLayanan } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-md">Assalamu'alaikum Warahmatullahi Wabarakatuh</p>
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang, {stats.pengurus.nama}</h1>
          <p className="text-gray-500 text-sm">Update data pondok per {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* 1. Baris Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Santri Aktif" value={stats.totalSantri} icon={<Users size={20}/>} color="blue" />
        <StatCard title="Ustadz Pengajar" value={stats.totalUstadz} icon={<UserCheck size={20}/>} color="green" />
        <StatCard title="Layanan Pending" value={stats.urgensi.layananPending} icon={<Clock size={20}/>} color="red" isUrgent={stats.urgensi.layananPending > 0} />
        <StatCard title="Verifikasi Pembayaran" value={stats.urgensi.verifikasiBayar} icon={<CreditCard size={20}/>} color="orange" isUrgent={stats.urgensi.verifikasiBayar > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Chart Tren Pemasukan */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-6">Pemasukan 6 Bulan Terakhir</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Pemasukan']}
                        />
                        <Area type="monotone" dataKey="nominal" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorNominal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. Ringkasan Dana & Hover Detail */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <h3 className="font-bold text-gray-800 mb-6">Status Keuangan</h3>
            <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white">
                    <p className="text-xs opacity-80 mb-1">Total Tagihan Lunas</p>
                    <h2 className="text-2xl font-black">Rp {stats.keuangan.terbayar.toLocaleString('id-ID')}</h2>
                </div>
                
                {/* Hover Piutang Area */}
                <div 
                    className="p-5 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl text-white transition-all hover:border-red-200"
                    onMouseEnter={() => setShowPiutangList(true)}
                    onMouseLeave={() => setShowPiutangList(false)}
                >
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs opacity-80">Total Tagihan Aktif</p>
                        <Info size={14} className="text-gray-300"/>
                    </div>
                    <h2 className="text-2xl font-black">Rp {stats.keuangan.piutang.toLocaleString('id-ID')}</h2>
                    
                    {/* Hover Card Detail Piutang */}
                    {showPiutangList && stats.keuangan.userPiutang.length > 0 && (
                        <div className="absolute left-0 right-0 top-full -mt-2 mx-6 z-10 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                            <p className="text-[10px] font-bold text-blue-600 mb-3 uppercase tracking-widest">Daftar Tunggakan Tagihan</p>
                            <div className="space-y-3">
                                {stats.keuangan.userPiutang.map((up, i) => (
                                    <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold">{up.nama.charAt(0)}</div>
                                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{up.nama}</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-500">Rp {up.total.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* 4. Okupansi & Layanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Okupansi Gender Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><Home size={18}/> Kapasitas Asrama</h3>
            <div className="space-y-8">
                <GenderProgress label="Santri Laki-laki" color="blue" data={stats.okupansiGender.Laki} />
                <GenderProgress label="Santri Perempuan" color="pink" data={stats.okupansiGender.Perempuan} />
            </div>
        </div>

        {/* Layanan Terakhir */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Antrean Layanan Terbaru</h3>
            </div>
            <div className="divide-y divide-gray-50">
                {recentLayanan.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center font-bold">
                                {item.status_sesudah === 'Selesai' ? <CheckCircle size={20} className="text-green-500"/> : <Clock size={20} className="text-orange-400 animate-pulse"/>}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">{item.jenis_layanan.nama_layanan}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase">{item.users.nama}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isUrgent }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600"
  };
  return (
    <div className={`p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4 ${isUrgent ? 'ring-2 ring-red-400 ring-offset-2 animate-pulse pointer-events-none' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-gray-800">{value}</h2>
      </div>
    </div>
  );
}

function GenderProgress({ label, color, data }) {
  const percent = data.kapasitas > 0 ? Math.round((data.terisi / data.kapasitas) * 100) : 0;
  const barColor = color === 'blue' ? 'bg-blue-500' : 'bg-pink-500';
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-pink-50';
  return (
    <div>
        <div className="flex justify-between text-xs mb-2">
            <span className="font-bold text-gray-600">{label}</span>
            <span className="text-gray-400">{data.terisi} / {data.kapasitas} Bed</span>
        </div>
        <div className={`w-full h-3 ${bgColor} rounded-full overflow-hidden`}>
            <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
  );
}