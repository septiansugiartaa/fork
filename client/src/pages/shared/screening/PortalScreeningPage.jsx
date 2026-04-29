import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../config/api";
import {
  ArrowLeft,
  Loader2,
  Plus,
  History,
  ClipboardList
} from "lucide-react";
import Pagination from "../../../components/pagination/Pagination";

export default function PortalScreeningPage({
    rolePrefix,
    canCreate = true,
    backPath,
    shellVariant = "default"
}) {
    const { id } = useParams();
    const navigate = useNavigate();
    const topRef = useRef(null);
    const [santri, setSantri] = useState(null);
    const [screening, setScreening] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [totalScreening, setTotalScreening] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const limit = 5;

    const fetchDetail = async () => {
        try {
        const [santriRes, screeningRes, latestRes] = await Promise.all([
            api.get(
            `/${rolePrefix}/screening/santri/${id}/detail`),
            api.get(
            `/${rolePrefix}/screening/santri/${id}/screening`, {params: { page, limit }}),
            api.get(
            `/${rolePrefix}/screening/santri/${id}/latest`)
        ]);

        setSantri(santriRes.data.data);
        setScreening(screeningRes.data.data);
        setLatest(latestRes.data.data);

        const total = screeningRes.data.pagination.total;
        setTotalPages(Math.ceil(total / limit));
        setTotalScreening(total);

        } catch (err) {
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id, page]);

    useEffect(() => {
        if (!loading && topRef.current) {
            topRef.current.scrollIntoView({
                block: "start"
            });
        }
    }, [loading, page]);

    if (loading)
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            </div>
        );

    if (!santri) return null;
    const riwayat = screening.filter(
        item => item.id_screening !== latest?.id_screening
    );

    const getDiagnosaStyle = (diagnosa) => {
        if (!diagnosa) return "text-gray-500";

        if (diagnosa === "Scabies")
            return "text-red-600 font-semibold";

        if (diagnosa === "Bukan_Scabies")
            return "text-green-600 font-semibold";

        if (
            diagnosa === "Kemungkinan_Scabies" ||
            diagnosa === "Perlu_Evaluasi_Lebih_Lanjut"
        )
            return "text-yellow-600 font-semibold";

        return "text-gray-600";
    };

    const renderScreeningCards = (items, emptyText) => {
        if (!items.length) {
            return (
                <div className="p-6 text-center text-gray-400 text-sm">
                    {emptyText}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-3 p-3">
                {items.map((item) => (
                    <div
                        key={item.id_screening}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-500">Tanggal</span>
                                <span className="font-medium text-gray-800 text-right">
                                    {new Date(item.tanggal).toLocaleDateString("id-ID")}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-500">Diagnosa</span>
                                <span className={`font-semibold text-right ${getDiagnosaStyle(item.diagnosa)}`}>
                                    {item.diagnosa?.replaceAll("_", " ") || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-500">Pemeriksa</span>
                                <span className="font-medium text-gray-800 text-right">
                                    {item.users_screening_id_timkesTousers?.nama || "-"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() =>
                                navigate(`/${rolePrefix}/daftarSantriScreening/${id}/view/${item.id_screening}`)
                            }
                            className="mt-4 w-full px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition"
                        >
                            View
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    const isScabiesShell = shellVariant === "scabies";
    const targetBackPath = backPath || `/${rolePrefix}/daftarSantriScreening`;

    return (
        <div
            ref={topRef}
            className={isScabiesShell ? "min-h-screen bg-gray-50 pb-10" : "space-y-6"}
        >
            {isScabiesShell ? (
                <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20">
                    <div className="max-w-6xl mx-auto flex items-center">
                        <button
                            onClick={() => navigate(targetBackPath)}
                            className="flex-shrink-0 rounded-full p-2 hover:bg-white/10 transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="ml-4">
                            <p className="text-green-100 text-sm font-semibold">Dashboard Scabies Orang Tua</p>
                            <h1 className="text-2xl font-bold">Portal Screening Anak</h1>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center mb-6">
                    <button
                    onClick={() => navigate(targetBackPath)}
                    className="flex-shrink-0 hover:bg-white/20 rounded-full transition"
                    >
                    <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 ml-4">
                    Portal Screening
                    </h1>
                </div>
            )}

            <div className={`max-w-6xl mx-auto px-4 md:px-6 space-y-8 relative z-10 ${isScabiesShell ? "-mt-12" : ""}`}>

                {/* DATA SANTRI */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    Data Diri Santri
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                    <label className="block text-sm font-medium text-green-600/80 mb-1">
                        Nama Santri
                    </label>
                    <p className="text-gray-900 font-semibold text-lg truncate">
                        {santri.nama}
                    </p>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-green-600/80 mb-1">
                        NIS
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                        {santri.nip}
                    </p>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-green-600/80 mb-1">
                        Kelas
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">
                        {santri.kelas?.kelas || "-"}
                    </p>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-green-600/80 mb-1">
                        Total Screening
                    </label>
                    <p className="text-green-600 font-bold text-lg">
                        {totalScreening}
                    </p>
                    </div>
                </div>
                </div>

                {/* SCREENING TERAKHIR */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <ClipboardList className="mr-2 text-green-600" size={24} />
                        Screening Terakhir
                        </h2>

                        {canCreate && (
                            <button
                            onClick={() =>
                                navigate(`/${rolePrefix}/daftarSantriScreening/${id}/create`)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center shadow-lg transition"
                            >
                            <Plus size={20} className="mr-2" />
                            Screening Baru
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full table-fixed border-collapse">
                            <thead>
                            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 pl-6 w-1/5">Tanggal</th>
                                <th className="p-4 w-1/3">Diagnosa</th>
                                <th className="p-4 w-1/4">Pemeriksa</th>
                                <th className="p-4 pr-6 w-1/6 text-center">Aksi</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-50">
                            {latest ? (
                                <tr className="hover:bg-green-50/50 transition">
                                <td className="p-4 pl-6">
                                    {new Date(latest.tanggal).toLocaleDateString("id-ID")}
                                </td>
                                <td className={`p-4 ${getDiagnosaStyle(latest.diagnosa)}`}>
                                    {latest.diagnosa?.replaceAll("_", " ")}
                                </td>
                                <td className="p-4">
                                    {latest.users_screening_id_timkesTousers?.nama || "-"}
                                </td>
                                <td className="text-center space-x-2">
                                    <button
                                        onClick={() =>
                                        navigate(`/${rolePrefix}/daftarSantriScreening/${id}/view/${latest.id_screening}`)
                                        }
                                        className="px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition"
                                    >
                                        View
                                    </button>
                                </td>
                                </tr>
                            ) : (
                                <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400">
                                    Belum ada screening.
                                </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        </div>
                        <div className="lg:hidden">
                            {renderScreeningCards(
                                latest ? [latest] : [],
                                "Belum ada screening."
                            )}
                        </div>
                    </div>
                </div>

                {/* RIWAYAT */}
                <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <History className="mr-2 text-green-600" size={24} />
                    Riwayat Hasil Screening
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full table-fixed border-collapse">
                        <thead>
                        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 pl-6 w-1/5">Tanggal</th>
                            <th className="p-4 w-1/3">Diagnosa</th>
                            <th className="p-4 w-1/4">Pemeriksa</th>
                            <th className="p-4 pr-6 w-1/6 text-center">Aksi</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50">
                            {riwayat.length > 0 ? (
                                riwayat.map((item) => (
                                <tr key={item.id_screening} className="hover:bg-gray-50 transition">
                                    <td className="p-4 pl-6">
                                        {new Date(item.tanggal).toLocaleDateString("id-ID")}
                                    </td>
                                    <td className={`p-4 ${getDiagnosaStyle(item.diagnosa)}`}>
                                        {item.diagnosa?.replaceAll("_", " ")}
                                    </td>
                                    <td className="p-4">
                                        {item.users_screening_id_timkesTousers?.nama || "-"}
                                    </td>
                                    <td className="text-center space-x-2">
                                        <button
                                            onClick={() =>
                                            navigate(`/${rolePrefix}/daftarSantriScreening/${id}/view/${item.id_screening}`)
                                            }
                                            className="px-4 py-2 border border-green-200 text-green-600 rounded-lg text-sm hover:bg-green-50 transition"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400">
                                    Belum ada riwayat screening.
                                </td>
                                </tr>
                            )}
                            </tbody>
                    </table>
                    </div>
                    <div className="lg:hidden">
                        {renderScreeningCards(
                            riwayat,
                            "Belum ada riwayat screening."
                        )}
                    </div>
                </div>
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onNext={() => {
                        setPage(prev => Math.min(prev + 1, totalPages));
                    }}
                    onPrev={() => {
                        setPage(prev => Math.max(prev - 1, 1));
                    }}
                />
                </div>

            </div>
            {isScabiesShell && <div className="h-2" />}
        </div>
    );
}
