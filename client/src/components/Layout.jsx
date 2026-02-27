import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  List,
  BookOpen,
  BookOpenText,
  ScanHeart,
  FileText,
  CreditCard,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  BedDouble,
  Activity,
  AlertCircle,
  Loader2,
  Star,
} from "lucide-react";

export default function GlobalLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          // Pastikan role di-lowercase agar format URL seragam (misal: 'Pimpinan' jadi 'pimpinan')
          setUserRole(res.data.data.role.toLowerCase());
        } else {
          throw new Error("Sesi tidak valid");
        }
      } catch (error) {
        console.error("Akses ditolak:", error);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyUser();
  }, [navigate]);

  // --- MASTER MENU CONFIGURATION ---
  // HAPUS nama role dari path di sini. Biarkan path berisi endpoint-nya saja.
  const masterMenu = [
    // Dashboard dibiarkan string kosong '' agar jadinya /pengurus atau /pimpinan
    {
      name: "Dashboard",
      path: "",
      icon: LayoutDashboard,
      roles: ["pengurus", "timkes", "pimpinan", "admin"],
    },

    // --- PENDATAAN ---
    { category: "PENDATAAN", roles: ["pengurus", "admin", "pimpinan"] },
    {
      name: "Data Santri",
      path: "/data-santri",
      icon: Users,
      roles: ["pengurus", "admin", "pimpinan"],
    },
    {
      name: "Data Ustadz",
      path: "/data-ustadz",
      icon: Users,
      roles: ["pengurus", "admin", "pimpinan"],
    },
    {
      name: "Data Kelas",
      path: "/data-kelas",
      icon: BookOpen,
      roles: ["pengurus", "admin"],
    },
    {
      name: "Data Kamar",
      path: "/data-kamar",
      icon: BedDouble,
      roles: ["pengurus", "admin"],
    },
    {
      name: "Jenis Layanan",
      path: "/jenis-layanan",
      icon: List,
      roles: ["pengurus", "admin"],
    },

    // --- KESEHATAN ---
    { category: "KESEHATAN", roles: ["timkes", "admin", "pimpinan"] },
    {
      name: "Materi Scabies",
      path: "/scabies/materi",
      icon: BookOpenText,
      roles: ["pimpinan"],
    },
    {
      name: "Materi",
      path: "/manageMateri",
      icon: BookOpenText,
      roles: ["timkes", "admin"],
    },
    {
      name: "Screening",
      path: "/daftarSantriScreening",
      icon: ScanHeart,
      roles: ["timkes", "admin", "pimpinan"],
    },

    // --- PENGADUAN ---
    { category: "PENGADUAN", roles: ["pengurus", "admin", "pimpinan"] },
    {
      name: "Pengaduan",
      path: "/pengaduan",
      icon: AlertCircle,
      roles: ["pengurus", "admin", "pimpinan"],
    },

    // --- LAYANAN & TRANSAKSI ---
    {
      category: "LAYANAN & TRANSAKSI",
      roles: ["pengurus", "admin", "pimpinan"],
    },
    {
      name: "Riwayat Layanan",
      path: "/riwayat-layanan",
      icon: FileText,
      roles: ["pengurus", "admin"],
    },
    {
      name: "Keuangan",
      path: "/keuangan",
      icon: CreditCard,
      roles: ["pengurus", "admin", "pimpinan"],
    },
    {
      name: "Feedback",
      path: "/feedback",
      icon: Star,
      roles: ["admin", "pimpinan"],
    },
  ];

  const filteredMenu = masterMenu.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-500 font-medium">Memverifikasi Sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        bg-gradient-to-b from-green-700 to-green-600 text-white shadow-xl flex flex-col
      `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-green-500/30">
          <h1 className="text-xl font-bold tracking-wide">SIM-Tren</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto pt-2 pb-6 space-y-1 [scrollbar-width:none]">
          {filteredMenu.map((item, index) => {
            if (item.category) {
              return (
                <div
                  key={`cat-${index}`}
                  className="px-6 mt-6 mb-2 text-xs font-bold text-white/50 uppercase tracking-wider"
                >
                  {item.category}
                </div>
              );
            }

            // --- LOGIKA URL DINAMIS ---
            // Menggabungkan role dengan path menu. Contoh: "/pimpinan" + "/data-santri"
            const rolePrefix = `/${userRole}`;
            const targetPath = `${rolePrefix}${item.path}`;

            // Penentuan state active:
            // Jika menu Dashboard (path ''), pastikan URL persis sama dengan /pimpinan
            // Jika menu lain, gunakan startsWith agar sub-menu (misal: /pimpinan/data-santri/tambah) tetap membuat menu nyala
            const isActive =
              item.path === ""
                ? location.pathname === rolePrefix ||
                  location.pathname === `${rolePrefix}/`
                : location.pathname.startsWith(targetPath);

            const Icon = item.icon;

            return (
              <div key={item.path} className="px-3">
                <button
                  onClick={() => {
                    navigate(targetPath); // Navigasi ke targetPath yang sudah digabung role
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium
                    ${
                      isActive
                        ? "bg-white text-green-700 shadow-md translate-x-1"
                        : "text-green-100 hover:bg-green-600/50 hover:text-white"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>
              </div>
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {/* Mencari judul menu berdasar path yang cocok */}
              {filteredMenu.find((m) => {
                const tPath = `/${userRole}${m.path}`;
                return m.path === ""
                  ? location.pathname === tPath ||
                      location.pathname === `${tPath}/`
                  : location.pathname.startsWith(tPath);
              })?.name || "Dashboard"}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
