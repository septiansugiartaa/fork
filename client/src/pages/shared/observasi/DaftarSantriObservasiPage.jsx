import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, FileText } from "lucide-react";
import Pagination from "../../../components/pagination/Pagination";
import api from "../../../config/api";
import { formatObservasiWaktu, getObservasiBadgeClass } from "../../../components/UtilsObservasi";

export default function DaftarSantriObservasiPage({ rolePrefix }) {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const limit = 5;

  const formatLatestObservasiDateTime = (latestObservasi) => {
    if (!latestObservasi?.tanggal) return "-";

    const tanggal = new Date(latestObservasi.tanggal).toLocaleDateString("id-ID");
    return `${tanggal} - ${formatObservasiWaktu(latestObservasi.waktu)}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchSantri = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/${rolePrefix}/observasi/santri`, {
          params: { search: debouncedSearch, page, limit }
        });
        setSantriList(res.data.data || []);
        setTotalPages(Math.max(1, Math.ceil((res.data.pagination?.total || 0) / limit)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSantri();
  }, [debouncedSearch, page, rolePrefix]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Daftar Santri</h1>
        <p className="text-gray-500 text-sm">Pilih santri untuk melihat riwayat observasi cuci tangan</p>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            className="w-full pl-10 pr-4 py-2.5 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-green-500 mb-2" size={32} />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold w-[20%]">Nama & NIS</th>
                    <th className="p-4 font-semibold w-[15%]">Riwayat Observasi Terakhir</th>
                    <th className="p-4 font-semibold text-center w-[15%]">Total Observasi</th>
                    <th className="p-4 font-semibold text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {santriList.length > 0 ? santriList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                            {item.foto_profil ? (
                              <img src={`/foto-profil/${item.foto_profil}`} alt={item.nama} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-green-600 font-bold text-sm bg-green-100 w-full h-full flex items-center justify-center">
                                {item.nama.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{item.nama}</p>
                            <p className="text-xs text-gray-500 truncate">NIS: {item.nip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top text-sm text-gray-600">
                        {item.latest_observasi ? (
                          <div className="space-y-1">
                            <p>{formatLatestObservasiDateTime(item.latest_observasi)}</p>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getObservasiBadgeClass(item.latest_observasi.kategori_skor)}`}>
                              {item.latest_observasi.skor_label}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-700">{item._count?.observasi_observasi_id_santriTousers || 0}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => navigate(`/${rolePrefix}/daftarSantriObservasi/${item.id}`)}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-green-100 transition"
                        >
                          <FileText size={16} />
                          Riwayat Observasi
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">Data santri tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {santriList.map((item) => {
              const latest = item.latest_observasi;
              const total = item._count?.observasi_observasi_id_santriTousers || 0;

              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.nama}</p>
                      <p className="text-xs text-gray-500">NIS: {item.nip}</p>
                    </div>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">{total}</span>
                  </div>

                  {latest ? (
                    <div>
                      <p className="text-xs text-gray-500">{formatLatestObservasiDateTime(latest)}</p>
                      <span className={`inline-flex mt-1 rounded-full px-3 py-1 text-xs font-semibold ${getObservasiBadgeClass(latest.kategori_skor)}`}>
                        {latest.skor_label}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Belum ada observasi</p>
                  )}

                  <button
                    onClick={() => navigate(`/${rolePrefix}/daftarSantriObservasi/${item.id}`)}
                    className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition"
                  >
                    Riwayat Observasi
                  </button>
                </div>
              );
            })}
          </div>

          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
            onNext={() => setPage(prev => Math.min(prev + 1, totalPages))}
            onPrev={() => setPage(prev => Math.max(prev - 1, 1))}
          />
        </>
      )}
    </div>
  );
}
