import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, FileText } from "lucide-react";
import Pagination from "../../../components/pagination/Pagination";
import api from "../../../config/api";

export default function DaftarSantriScreening() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const limit = 5;

  const fetchSantri = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/screening/santri", {
        params: { search, page, limit }
      });

      setSantriList(res.data.data);
      setTotalPages(Math.ceil(res.data.pagination.total / limit));
    } catch (err) {
      console.error("Fetch error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const getDiagnosaStyle = (diagnosa) => {
    if (!diagnosa) return "text-gray-500";
    if (diagnosa === "Scabies") return "text-red-600 font-semibold";
    if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";
    if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut")
      return "text-yellow-600 font-semibold";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Daftar Santri</h1>
        <p className="text-gray-500 text-sm">Pilih santri untuk melihat riwayat screening</p>
      </div>

      <div className="w-full pl-2 pr-4 py-2.5 rounded-xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-green-500 transition-all">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            className="w-full pl-10 pr-4 py-2.5 outline-none bg-transparent"
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Nama & NIS</th>
                    <th className="p-4 font-semibold">Riwayat Screening Terakhir</th>
                    <th className="p-4 font-semibold text-center">Total Screening</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {santriList.length > 0 ? (
                    santriList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                              {item.foto_profil ? (
                                <img
                                  src={`/foto-profil/${item.foto_profil}`}
                                  alt={item.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-green-600 font-bold text-sm bg-green-100 w-full h-full flex items-center justify-center">
                                  {item.nama.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{item.nama}</p>
                              <p className="text-xs text-gray-500">NIS: {item.nip}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top text-sm text-gray-600">
                          {item.screening_screening_id_santriTousers?.length > 0 ? (
                            <>
                              <p>{new Date(item.screening_screening_id_santriTousers[0].tanggal).toLocaleDateString("id-ID")}</p>
                              <p className={getDiagnosaStyle(item.screening_screening_id_santriTousers[0].diagnosa)}>
                                {item.screening_screening_id_santriTousers[0].diagnosa.replaceAll("_", " ")}
                              </p>
                            </>
                          ) : "-"}
                        </td>
                        <td className="p-4 text-center font-semibold text-gray-700">
                          {item.screening_screening_id_santriTousers?.length || 0}
                        </td>
                        <td className="flex justify-center items-center p-4 align-top">
                          <button
                            onClick={() => navigate(`/admin/daftarSantriScreening/${item.id}`)}
                            className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition"
                          >
                            <FileText size={16} />
                            Riwayat Screening
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
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
              const latest = item.screening_screening_id_santriTousers?.[0];
              const total = item.screening_screening_id_santriTousers?.length || 0;
              return (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{item.nama}</p>
                      <p className="text-xs text-gray-500">NIS: {item.nip}</p>
                    </div>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">{total}</span>
                  </div>
                  {latest ? (
                    <div>
                      <p className="text-xs text-gray-500">{new Date(latest.tanggal).toLocaleDateString("id-ID")}</p>
                      <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full ${
                          latest?.diagnosa === "Scabies" ? "bg-red-100 text-red-700" : 
                          latest?.diagnosa === "Bukan_Scabies" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {latest.diagnosa.replaceAll("_", " ")}
                      </span>
                    </div>
                  ) : <p className="text-gray-400 text-sm">Belum ada screening</p>}
                  <button
                    onClick={() => navigate(`/admin/daftarSantriScreening/${item.id}`)}
                    className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition"
                  >
                    Riwayat Screening
                  </button>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
          />
        </>
      )}
    </div>
  );
}