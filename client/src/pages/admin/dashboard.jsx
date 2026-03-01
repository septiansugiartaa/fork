import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, UserCog, Database, AlertTriangle, ShieldCheck, 
  BedDouble, BookOpen, List, Receipt, Loader2, Activity, Clock
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const capitalize = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Helper: Format Waktu Log
const formatTimeAgo = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', { 
    day: 'numeric', month: 'long', year:'numeric', hour: '2-digit', minute: '2-digit', second:'2-digit' 
  }).format(date);
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Palet Warna untuk Pie Chart Role
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#ec4899'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/admin/dashboard/stats", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        if (res.data && res.data.chartDataRole) {
            res.data.chartDataRole = res.data.chartDataRole.map(item => ({
                ...item,
                name: capitalize(item.name)
            }));
        }

        setData(res.data);
      } catch (err) { 
          console.error(err); 
      } finally { 
          setLoading(false); 
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!data) return null;

  // Pastikan destructure recentLogs (kasih default array kosong kalau API belum diupdate)
  const { stats, chartDataRole, recentLogs = [] } = data;

  // Menentukan status kesehatan sistem
  const isSystemHealthy = stats.systemHealth.orphanKamar === 0 && stats.systemHealth.orphanKelas === 0;

  return (
    <div className="space-y-6">
      
      {/* Header Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-md">Panel Administrator Sistem</p>
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang, {stats.admin.nama}</h1>
          <p className="text-gray-500 text-sm">Status sistem per {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* 1. Baris Statistik Utama (Users & System Health) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pengguna Aktif" value={stats.totalUsers} icon={<Users size={20}/>} color="green" />
        <StatCard title="Laki-laki" value={stats.genderStats.Laki} icon={<UserCog size={20}/>} color="blue" />
        <StatCard title="Perempuan" value={stats.genderStats.Perempuan} icon={<UserCog size={20}/>} color="pink" />
        
        {/* Indikator System Health Dinamis */}
        <div className={`p-5 rounded-xl border flex items-center gap-4 ${isSystemHealthy ? 'bg-white border-gray-100 shadow-sm' : 'bg-red-50 border-red-200 shadow-sm ring-2 ring-red-400 ring-offset-2 animate-pulse pointer-events-none'}`}>
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSystemHealthy ? 'bg-green-50 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {isSystemHealthy ? <ShieldCheck size={20}/> : <AlertTriangle size={20}/>}
           </div>
           <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isSystemHealthy ? 'text-gray-400' : 'text-red-500'}`}>System Health</p>
              <h2 className={`text-xl font-black ${isSystemHealthy ? 'text-gray-800' : 'text-red-700'}`}>
                 {isSystemHealthy ? 'Optimal' : 'Perlu Atensi'}
              </h2>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Chart Demografi Role */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-2">Demografi Hak Akses (Role)</h3>
            <p className="text-xs text-gray-500 mb-4">Distribusi akun pengguna dalam sistem</p>
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartDataRole}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartDataRole.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}/>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {chartDataRole.length === 0 && <p className="text-center text-sm text-gray-400 mt-[-100px]">Belum ada data role</p>}
        </div>

        {/* 3. Panel Master Data Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               <Database size={18} className="text-blue-600"/> Referensi Master Data
            </h3>
            <div className="space-y-4">
                <MasterDataRow label="Data Kamar" count={stats.masterData.kamar} icon={<BedDouble size={16}/>} />
                <MasterDataRow label="Data Kelas" count={stats.masterData.kelas} icon={<BookOpen size={16}/>} />
                <MasterDataRow label="Jenis Layanan" count={stats.masterData.layanan} icon={<List size={16}/>} />
                <MasterDataRow label="Jenis Tagihan" count={stats.masterData.tagihan} icon={<Receipt size={16}/>} />
            </div>
        </div>

        {/* 4. Panel System Health Peringatan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               <AlertTriangle size={18} className="text-orange-500"/> Log Peringatan Data
            </h3>
            
            <div className="space-y-3">
                {isSystemHealthy ? (
                    <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                        <ShieldCheck size={32} className="text-green-500 mx-auto mb-2 opacity-50"/>
                        <p className="text-sm font-medium text-gray-500">Tidak ada data orphan. Relasi database sempurna.</p>
                    </div>
                ) : (
                    <>
                        {stats.systemHealth.orphanKamar > 0 && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><BedDouble size={18}/></div>
                                <div>
                                    <h4 className="font-bold text-red-800 text-sm">Santri Tanpa Kamar</h4>
                                    <p className="text-xs text-red-600 mt-1">
                                        Terdapat <span className="font-black text-red-700 text-base">{stats.systemHealth.orphanKamar}</span> santri aktif yang belum dialokasikan ke asrama. Harap instruksikan Pengurus.
                                    </p>
                                </div>
                            </div>
                        )}

                        {stats.systemHealth.orphanKelas > 0 && (
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><BookOpen size={18}/></div>
                                <div>
                                    <h4 className="font-bold text-orange-800 text-sm">Santri Tanpa Kelas</h4>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Terdapat <span className="font-black text-orange-700 text-base">{stats.systemHealth.orphanKelas}</span> santri aktif yang belum terdaftar di kelas manapun.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>

      {/* 5. PANEL BARU: ACTIVITY LOG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <Activity size={18} className="text-blue-600"/> Log Aktivitas Terbaru
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
               5 Aktivitas Terakhir
            </span>
         </div>

         {recentLogs.length > 0 ? (
            <div className="space-y-4">
               {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition">
                     {/* Badge Aksi */}
                     <div className="mt-0.5">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider flex justify-center w-[70px]
                           ${log.aksi === 'CREATE' ? 'bg-green-100 text-green-700' : 
                             log.aksi === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 
                             'bg-red-100 text-red-700'}`}
                        >
                           {log.aksi}
                        </span>
                     </div>
                     
                     {/* Info Log */}
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-tight">
                           {log.keterangan}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                           <span className="font-semibold text-gray-700 capitalize">{log.role_user}</span>
                           <span>•</span>
                           <span className="uppercase tracking-wider">{log.entitas}</span>
                           <span>•</span>
                           <span className="flex items-center gap-1"><Clock size={12}/> {formatTimeAgo(log.created_at)}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <Activity size={32} className="mx-auto text-gray-300 mb-2" />
               <p className="text-sm text-gray-500 font-medium">Belum ada catatan aktivitas di sistem.</p>
            </div>
         )}
      </div>

    </div>
  );
}

// Komponen Reusable StatCard (Sama dengan Pengurus)
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
    pink: "bg-pink-100 text-pink-600"
  };
  return (
    <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <h2 className="text-2xl font-black text-gray-800">{value}</h2>
      </div>
    </div>
  );
}

// Komponen UI untuk List Master Data
function MasterDataRow({ label, count, icon }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl">
            <div className="flex items-center gap-3 text-gray-700">
                <div className="text-blue-500">{icon}</div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-sm font-bold text-gray-800 shadow-sm">
                {count}
            </div>
        </div>
    );
}