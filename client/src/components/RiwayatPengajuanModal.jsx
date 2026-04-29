import { useState, useEffect } from "react";
import { X, Clock, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import api from "../config/api";

const STATUS_CONFIG = {
  ditinjau:  { label: "Ditinjau",  icon: Clock,         className: "text-amber-600  bg-amber-50  border-amber-200"  },
  disetujui: { label: "Disetujui", icon: CheckCircle,   className: "text-green-600  bg-green-50  border-green-200"  },
  ditolak:   { label: "Ditolak",   icon: XCircle,       className: "text-red-600    bg-red-50    border-red-200"    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ditinjau;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

const RiwayatPengajuanModal = ({ isOpen, onClose }) => {
  const [riwayat, setRiwayat]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const fetchRiwayat = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/global/riwayatPengajuanMateri");
      if (res.data.success) {
        setRiwayat(res.data.data.list_pengajuan);
      } else {
        setError("Gagal memuat riwayat.");
      }
    } catch (err) {
      console.error("fetchRiwayat:", err);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRiwayat();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTanggal = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Riwayat Pengajuan</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Status pengajuan materi pengalaman Anda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-84px)] p-5 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p className="text-sm">Memuat riwayat...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
              {error}
              <button
                onClick={fetchRiwayat}
                className="block mx-auto mt-2 underline text-red-500 hover:text-red-700"
              >
                Coba lagi
              </button>
            </div>
          ) : riwayat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">Belum ada pengajuan materi</p>
              <p className="text-xs mt-1">Ajukan materi pengalaman Anda dengan tombol &quot;Ajukan Materi Pengalaman&quot;</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600 whitespace-nowrap">
                      Tanggal Pengajuan
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">
                      Judul Materi
                    </th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-600 whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                        {formatTanggal(item.tanggal_pengajuan)}
                      </td>
                      <td className="py-3 px-2 text-gray-800 font-medium">
                        <div>{item.judul}</div>
                        {item.catatan_timkes && (
                          <div
                            className={`text-xs mt-0.5 ${
                              item.status === "ditolak"
                                ? "text-red-500"
                                : "text-gray-400"
                            }`}
                          >
                            {item.catatan_timkes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiwayatPengajuanModal;
