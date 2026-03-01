import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, BookOpenText, ScanHeart } from 'lucide-react';

export default function TimkesLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Menu Configuration
  const menus = [
    { name: 'Dashboard', path: '/timkesehatan', icon: LayoutDashboard },
    // --- MASTER DATA ---
    { category: 'KESEHATAN' },
    { name: 'Materi', path: '/timkesehatan/manageMateri', icon: BookOpenText },
    { name: 'Screening', path: '/timkesehatan/daftarSantriScreening', icon: ScanHeart },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- SIDEBAR (Desktop & Mobile Wrapper) --- */}
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-green-700 to-green-600 text-white shadow-xl flex flex-col
      `}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-green-500/30">
          <h1 className="text-xl font-bold tracking-wide">SIM-Tren </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/80 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 [scrollbar-width:none]">
          {menus.map((item, index) => {
            
            // LOGIC 1: Jika item adalah JUDUL KATEGORI
            if (item.category) {
              return (
                <div 
                  key={index} 
                  className="px-4 mt-6 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider">
                  {item.category}
                </div>
              );
            }

            // LOGIC 2: Jika item adalah MENU BIASA
            const isActive = item.path === "/timkesehatan"
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                  ${isActive 
                    ? 'bg-white text-green-700 shadow-md translate-x-1' 
                    : 'text-green-100 hover:bg-green-600/50 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t border-green-500/30">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-100 hover:bg-red-500/30 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>


      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header (Mobile Toggle & Title) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
                {menus.find((m) => {
                    if (!m.path) return false;

                    if (m.path === "/timkesehatan") {
                        return location.pathname === m.path;
                    }

                    return location.pathname.startsWith(m.path);
                })?.name || 'Dashboard'
                }
            </h2>
          </div>
        </header>

        {/* Page Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
             {/* Render Halaman Anak Disini */}
             <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}