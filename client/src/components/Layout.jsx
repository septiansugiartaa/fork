import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../config/api";

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
  History,
  BookCheck,
  Receipt,
  BarChart3,
  UserPlus,
  ClipboardCheck
} from "lucide-react";

export default function GlobalLayout() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const rolePrefix = userRole ? `/${userRole}` : "";

  useEffect(() => {

    const verifyUser = async () => {

      if (!localStorage.getItem("token")) {
        navigate("/login");
        return;
      }

      try {

        const { data } = await api.get("/auth/me");

        if (data.success) {
          setUserRole(data.data?.role?.toLowerCase() || "");
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

  const masterMenu = [

    {
      name: "Dashboard",
      path: "",
      icon: LayoutDashboard,
      roles: ["pengurus", "timkesehatan", "pimpinan", "admin"],
    },

    { category: "PENDATAAN", roles: ["pengurus", "admin", "pimpinan"] },

    {
      name: "Manajemen Staf",
      path: "/data-staf",
      icon: Users,
      roles: ["admin"],
    },

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

    { category: "KESEHATAN", roles: ["timkesehatan", "admin", "pimpinan"] },

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
      roles: ["timkesehatan", "admin"],
    },

    {
      name: "Screening",
      path: "/daftarSantriScreening",
      icon: ScanHeart,
      roles: ["timkesehatan", "admin", "pimpinan"],
    },

    {
      name: "Observasi Cuci Tangan",
      path: "/daftarSantriObservasi",
      icon: ClipboardCheck,
      roles: ["timkesehatan", "admin", "pimpinan"],
    },

    {
      name: "Absensi Kesehatan",
      path: "/daftarAbsensiKamar",
      icon: BookCheck,
      roles: ["timkesehatan", "admin"],
    },

    { category: "PENGADUAN", roles: ["admin", "pimpinan"] },

    {
      name: "Pengaduan",
      path: "/pengaduan",
      icon: AlertCircle,
      roles: ["admin", "pimpinan"],
    },

    {
      category: "KEGIATAN DAN LAYANAN",
      roles: ["pengurus", "admin", "pimpinan"],
    },

    {
      name: "Kegiatan",
      path: "/kegiatan",
      icon: Activity,
      roles: ["pengurus", "admin"],
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

    {
      category: "PPDB",
      roles: ["pengurus", "admin", "pimpinan"],
    },

    {
      name: "Rekapitulasi",
      path: "/ppdb/rekapitulasi",
      icon: BarChart3,
      roles: ["pengurus", "admin", "pimpinan"],
    },

    {
      name: "Pendaftar",
      path: "/ppdb/pendaftar",
      icon: UserPlus,
      roles: ["pengurus", "admin", "pimpinan"],
    },

    {
      name: "Seleksi",
      path: "/ppdb/seleksi",
      icon: ClipboardCheck,
      roles: ["pengurus", "admin", "pimpinan"],
    },

    { category: "LOG AKTIVITAS", roles: ["admin"] },

    {
      name: "Log Aktivitas",
      path: "/log",
      icon: History,
      roles: ["admin"],
    },

    { category: "BANTUAN", roles: ["pengurus", "timkesehatan", "pimpinan", "admin"] },

    {
      name: "FAQ",
      path: "/faq",
      icon: Receipt,
      roles: ["pengurus", "timkesehatan", "pimpinan", "admin"],
    }
  ];

  const filteredMenu = masterMenu.filter((item) =>
    item.roles.includes(userRole)
  );

  const getHeaderTitle = () => {

    const path = location.pathname;

    if (path.includes("manageMateri")) return "Materi";
    if (path.includes("daftarSantriScreening")) return "Screening";
    if (path.includes("daftarAbsensiKamar")) return "Absensi Kesehatan";

    const menuMatch = filteredMenu.find((m) => {

      const tPath = `${rolePrefix}${m.path}`;

      return m.path === ""
        ? path === rolePrefix || path === `${rolePrefix}/`
        : path.startsWith(tPath);

    });

    return menuMatch?.name || "Dashboard";

  };

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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        bg-gradient-to-b from-green-700 to-green-600 text-white shadow-xl flex flex-col`}
      >

        <div className="h-16 flex items-center justify-between px-6 border-b border-green-500/30">
          <h1 className="text-xl font-bold tracking-wide">SIM-Tren</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

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

            const targetPath = `${rolePrefix}${item.path}`;

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
                    navigate(targetPath);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium
                  ${
                    isActive
                      ? "bg-white text-green-700 shadow-md translate-x-1"
                      : "text-green-100 hover:bg-green-600/50 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </button>

              </div>

            );

          })}

        </nav>

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

      {/* MAIN */}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">

          <div className="flex items-center gap-4">

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800">
              {getHeaderTitle()}
            </h2>

          </div>

        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">

          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>

        </main>

      </div>

    </div>

  );

}