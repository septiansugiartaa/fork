import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../../config/api";
import { Loader2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function ViewScreening() {
    const { screeningId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const routePrefix = location.pathname.split('/')[1];

    useEffect(() => {
        fetchData();
    }, [screeningId]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/admin/screening/${screeningId}`);
            setData(res.data.data);
        } catch (err) {
            console.error("Fetch error:", err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        const element = document.getElementById("paper");
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.7);
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        pdf.save(`Laporan-Screening-${screeningId}.pdf`);
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
    );

    if (!data) return null;

    const santri = data.users_screening_id_santriTousers;
    const timkes = data.users_screening_id_timkesTousers;
    const kelas = santri?.kelas_santri?.[0]?.kelas?.kelas || "-";
    const kamar = santri?.kamar_santri?.[0]?.kamar?.kamar || "-";
    const bagianA = data.detail_screening.filter(d => d.pertanyaan_screening.bagian === "A");
    const bagianB = data.detail_screening.filter(d => d.pertanyaan_screening.bagian === "B");

    const getDiagnosaStyle = (diagnosa) => {
        if (diagnosa === "Scabies") return "text-red-600 font-semibold";
        if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";
        return "text-yellow-600 font-semibold";
    };
        
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mb-10 flex items-center">
                <button
                    onClick={() => navigate(`/${routePrefix}/daftarSantriScreening/${santri?.id}`)}
                    className="flex-shrink-0 hover:bg-gray-200 p-2 rounded-full transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-3">
                    Detail Laporan Screening Santri
                </h1>
            </div>

            <div id="paper" className="bg-white w-full max-w-[210mm] px-6 sm:px-10 py-8 pb-[30mm] shadow-2xl text-sm mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold text-black tracking-wide uppercase">
                        Laporan Hasil Screening Kesehatan
                    </h1>
                    <p className="text-[12px] text-gray-500 italic">Sistem Manajemen Pondok Pesantren (SIM-Tren)</p>
                    <div className="h-[1px] bg-black my-4"></div>
                </div>

                <SectionTitle title="DATA SANTRI" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 mb-8 text-sm">
                    <DataRow label="Nama" value={santri?.nama} />
                    <DataRow label="NIS" value={santri?.nip} />
                    <DataRow label="Kamar" value={kamar} />
                    <DataRow label="Pendidikan" value={kelas} />
                    <DataRow label="Tanggal Periksa" value={new Date(data.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} />
                </div>

                <SectionTitle title="A. RIWAYAT 14 - 30 HARI TERAKHIR" />
                <QuestionList questions={bagianA} />

                <SectionTitle title="B. GEJALA YANG DIALAMI" />
                <QuestionList questions={bagianB} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <SectionTitle title="C. FOTO PREDILEKSI" />
                        <div className="mb-8">
                            {data.foto_predileksi ? (
                                <img
                                    src={`/uploads/screening/${data.foto_predileksi}`}
                                    alt="Foto Predileksi"
                                    className="w-56 border border-gray-200 rounded-md shadow-sm"
                                />
                            ) : <p className="text-gray-400 italic text-[12px]">Tidak ada foto</p>}
                        </div>
                    </div>
                    <div>
                        <SectionTitle title="D. DIAGNOSA"/>
                        <div className="mb-8">
                            <p className={`${getDiagnosaStyle(data.diagnosa)} text-[12px] uppercase`}>
                                {data.diagnosa.replaceAll("_", " ")}
                            </p>
                        </div>
                    </div>
                    <div>
                        <SectionTitle title="E. PENANGANAN" />
                        <ul className="list-disc ml-5 mb-10 space-y-1">
                            {data.screening_penanganan.map((p) => (
                                <li key={p.id} className="text-[12px]">{p.penanganan.opsi_penanganan}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-10 space-y-2 text-[12px] border-t pt-6">
                    <div className="flex"><p className="w-40">Pemeriksa</p><p>: {timkes?.nama || "Tim Kesehatan"}</p></div>
                    <div className="flex"><p className="w-40">Status</p><p>: Terverifikasi Sistem</p></div>
                </div>
            </div>

            <button
                onClick={handleDownload}
                className="fixed bottom-6 right-6 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xl font-bold transition-all print:hidden"
            >
                Download PDF Official
            </button>
        </div>
    );
}

function SectionTitle({ title }) {
    return <h2 className="text-green-700 font-bold tracking-wider text-[13px] mb-4 border-b pb-1">{title}</h2>;
}

function DataRow({ label, value }) {
    return (
        <div className="flex text-[12px]">
            <p className="w-36 text-gray-500">{label}</p>
            <p className="font-medium text-gray-800">: {value || "-"}</p>
        </div>
    );
}

function QuestionList({ questions }) {
    return (
        <div className="mb-8 space-y-2">
            {questions.map((item, index) => (
                <div key={item.id_detail_screening} className="flex justify-between items-center border-b border-gray-50 pb-1">
                    <p className="text-[12px] text-gray-700">{index + 1}. {item.pertanyaan_screening.pertanyaan}</p>
                    <span className={`text-[11px] font-bold ${item.jawaban ? "text-green-600" : "text-red-500"}`}>
                        {item.jawaban ? "YA" : "TIDAK"}
                    </span>
                </div>
            ))}
        </div>
    );
}