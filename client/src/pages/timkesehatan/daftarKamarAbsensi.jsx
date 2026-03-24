import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, FileText } from "lucide-react";
import Pagination from "../../components/pagination/Pagination";
import api from "../../config/api";

export default function DaftarKamarAbsensi() {
  const [kamarList, setKamarList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const limit = 5;

  const fetchKamar = async () => {
    setLoading(true);

    try {
      const res = await api.get("/timkesehatan/absensi/kamar", {
        params: {
          search: debouncedSearch,
          page,
          limit
        }
      });

      setKamarList(res.data.data || []);

      const total = res.data.pagination.total || 0;
      setTotalPages(Math.ceil(total / limit));

    } catch (err) {
      console.error("Fetch kamar error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* debounce search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* fetch data */
  useEffect(() => {
    fetchKamar();
  }, [debouncedSearch, page]);

  /* reset page ketika search berubah */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Daftar Kamar
        </h1>
        <p className="text-gray-500 text-sm">
          Pilih kamar untuk melakukan absensi kebersihan
        </p>
      </div>

      {/* Search */}
      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />

          <input
            type="text"
            placeholder="Cari nama kamar..."
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
          {/* DESKTOP TABLE */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-left table-fixed border-collapse">

                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold w-[15%]">Nama Kamar</th>
                        <th className="p-4 font-semibold w-[15%]">Riwayat Absensi Terakhir</th>
                        <th className="p-4 font-semibold text-center w-[15%]">Total Absensi Bulan Ini</th>
                        <th className="p-4 font-semibold text-center w-[15%]">Gender</th>
                        <th className="p-4 font-semibold text-center w-[15%]">Aksi</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                    {kamarList.length > 0 ? (
                        kamarList.map((item) => {

                        const latestAbsensi = item.heading_absensi?.[0];

                        return (
                            <tr key={item.id} className="hover:bg-gray-50 transition">

                            {/* NAMA KAMAR */}
                            <td className="p-4 font-semibold text-gray-800">
                                {item.kamar}
                            </td>

                            {/* RIWAYAT TERAKHIR */}
                            <td className="p-4 text-sm text-gray-600">
                                {latestAbsensi ? (
                                new Date(latestAbsensi.tanggal).toLocaleDateString("id-ID")
                                ) : (
                                "-"
                                )}
                            </td>

                            {/* TOTAL ABSENSI BULAN INI */}
                            <td className="p-4 text-center text-gray-700">
                                {item.total_absensi_bulan_ini || 0}
                            </td>

                            {/* GENDER */}
                            <td className="p-4 text-center text-gray-700">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.gender === 'Laki_laki' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>{item.gender === 'Laki_laki' ? 'Laki-laki' : 'Perempuan'}</span>
                            </td>

                            {/* AKSI */}
                            <td className="flex justify-center items-center p-4">
                                <button
                                onClick={() =>
                                    navigate(`/timkesehatan/daftarAbsensiKamar/${item.id}`)
                                }
                                className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-green-100 transition"
                                >
                                <FileText size={16} />
                                Portal Absensi
                                </button>
                            </td>

                            </tr>
                        );

                        })
                    ) : (
                        <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                            Data kamar tidak ditemukan.
                        </td>
                        </tr>
                    )}

                    </tbody>

              </table>

            </div>

          </div>

          {/* MOBILE CARD */}
          <div className="md:hidden space-y-4">
            {kamarList.map((item) => {

                const latest = item.heading_absensi?.[0];

                return (
                <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl shadow-sm space-y-3"
                >

                    <div className="flex justify-between items-center">

                    <div>
                        <p className="font-semibold text-gray-800">
                        {item.kamar}
                        </p>

                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.gender === 'Laki_laki' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>{item.gender === 'Laki_laki' ? 'Laki-laki' : 'Perempuan'}</span>
                          
                    </div>

                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                        {item.total_absensi_bulan_ini || 0}
                    </span>

                    </div>

                    {latest ? (
                    <p className="text-xs text-gray-500">
                        Absensi terakhir: {new Date(latest.tanggal).toLocaleDateString("id-ID")}
                    </p>
                    ) : (
                    <p className="text-gray-400 text-sm">
                        Belum ada absensi
                    </p>
                    )}

                    <button
                    onClick={() =>
                        navigate(`/timkesehatan/daftarAbsensiKamar/${item.id}`)
                    }
                    className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition"
                    >
                    Portal Absensi
                    </button>

                </div>
                );

            })}
            </div>

          {/* PAGINATION */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onNext={() =>
              setPage((prev) => Math.min(prev + 1, totalPages))
            }
            onPrev={() =>
              setPage((prev) => Math.max(prev - 1, 1))
            }
          />

        </>
      )}

    </div>
  );
}