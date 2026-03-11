import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import { Loader2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function ViewScreening() {
    const { screeningId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [screeningId]);

    const fetchData = async () => {
        try {
        const res = await api.get(
            `/timkesehatan/screening/${screeningId}`);

        setData(res.data.data);
        } catch (err) {
        console.error(err);
        alert("Gagal memuat data");
        } finally {
        setLoading(false);
        }
    };

    if (loading)
        return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        </div>
        );

    if (!data) return null;

    const santri = data.users_screening_id_santriTousers;
    const timkesehatan = data.users_screening_id_timkesTousers;

    const kelas =
        santri?.kelas_santri?.[0]?.kelas?.kelas || "-";

    const kamar =
        santri?.kamar_santri?.[0]?.kamar?.kamar || "-";

    const bagianA = data.detail_screening.filter(
        (d) => d.pertanyaan_screening.bagian === "A"
    );

    const bagianB = data.detail_screening.filter(
        (d) => d.pertanyaan_screening.bagian === "B"
    );

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

        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

        pdf.save(`Laporan-Screening-${screeningId}.pdf`);
    };

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
        
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mb-10 flex items-center">
                <button
                    onClick={() => navigate(`/timkesehatan/daftarSantriScreening/${santri?.id}`)}
                    className="flex-shrink-0 hover:bg-white/20 rounded-full transition"
                    >
                    <ArrowLeft size={24} />
                </button>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-3">
                    Detail Laporan Screening Santri
                </h1>

                <div /> {/* spacer biar tengah tetap center */}
                </div>
            <div
                id="paper"
                className="
                    bg-white
                    w-full
                    max-w-[210mm]
                    px-6 sm:px-10
                    py-8
                    pb-[30mm]
                    shadow-2xl
                    text-sm
                    mx-auto
                "
                >

                {/* HEADER */}
                <div className="text-center mb-8">
                    <h1 className="text-xl font-bold text-black tracking-wide">
                        LAPORAN HASIL SCREENING KESEHATAN
                    </h1>
                    <p className="text-[12px] text-gray-500">
                        Sistem Screening Kesehatan
                    </p>
                    <div className="h-[1px] bg-black my-4"></div>
                </div>

                {/* DATA SANTRI */}
                <SectionTitle title="DATA SANTRI" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 mb-8 text-sm">

                    <DataRow label="Nama" value={santri?.nama} />
                    <DataRow label="NIS" value={santri?.nip} />
                    <DataRow label="Kamar" value={kamar} />
                    <DataRow label="Pendidikan" value={kelas} />
                    <DataRow
                        label="Tanggal Pemeriksaan"
                        value={new Date(data.tanggal).toLocaleDateString("id-ID")}
                    />
                </div>

                {/* BAGIAN A */}
                <SectionTitle title="A. RIWAYAT 14 - 30 HARI TERAKHIR" />
                <QuestionList questions={bagianA} />

                {/* BAGIAN B */}
                <SectionTitle title="B. GEJALA YANG DIALAMI" />
                <QuestionList questions={bagianB} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                {/* BAGIAN C */}
                <SectionTitle title="C. FOTO PREDILEKSI" />
                <div className="mb-8">
                    {data.foto_predileksi ? (
                        <a
                        href={`/uploads/screening/${data.foto_predileksi}`}
                        target="_blank"
                        rel="noreferrer"
                        >
                            <img
                                src={`/uploads/screening/${data.foto_predileksi}`}
                                alt="foto"
                                className="w-56 border border-green-600 rounded-md hover:scale-105 transition"
                            />
                        </a>
                    ) : (
                        <p className="text-gray-500 italic text-[12px]">Belum ada foto</p>
                    )}
                </div>
                </div>
                <div>
                {/* BAGIAN D */}
                <SectionTitle title="D. DIAGNOSA"/>
                <div className="mb-8 ">
                    <p className={`${getDiagnosaStyle(data.diagnosa)} text-[12px]`}>
                        {data.diagnosa.replaceAll("_", " ")}
                    </p>
                </div>
                </div>
                <div>
                {/* BAGIAN E */}
                <SectionTitle title="E. PENANGANAN" />

                {data.screening_penanganan.length === 1 ? (
                <div className="mb-10">
                    <p className="text-[12px] font-semibold">
                    {data.screening_penanganan[0].penanganan.opsi_penanganan}
                    </p>
                </div>
                ) : (
                <ul className="mb-10 space-y-1">
                    {data.screening_penanganan.map((p) => (
                    <li key={p.id} className="text-[12px] list-decimal list-outside max-w-48 ml-4">
                        {p.penanganan.opsi_penanganan}
                    </li>
                    ))}
                </ul>
                )}
                </div>
                </div>
                {/* FOOTER */}
                <div className="space-y-2 text-[12px]">
                    <div className="flex">
                        <p className="w-40">Nama Pemeriksa</p>
                        <p>: {timkesehatan?.nama}</p>
                    </div>

                    <div className="flex">
                        <p className="w-40">Jabatan</p>
                        <p>: Tim Kesehatan</p>
                    </div>
                </div>
            </div>
            <button
                onClick={handleDownload}
                className="
                    fixed
                    bottom-4 right-4
                    sm:bottom-6 sm:right-6
                    px-4 sm:px-6
                    py-2 sm:py-3
                    text-sm sm:text-base
                    bg-green-600 hover:bg-green-700
                    text-white
                    rounded-xl
                    shadow-lg
                    print:hidden
                    "
                >
                Download PDF
            </button>
        </div>
    );
    }

    // KOMPONEN PENDEK
    function SectionTitle({ title }) {
        return (
            <div className="mb-4">
                <h2 className="text-green-600 font-bold tracking-wide text-[14px]">
                    {title}
                </h2>
            </div>
        );
    }

    function DataRow({ label, value }) {
        return (
            <div className="flex text-[12px]">
            <p className="w-40 ">{label}</p>
            <p>: {value || "-"}</p>
            </div>
        );
    }

    function QuestionList({ questions }) {
        return (
            <div className="mb-8 space-y-3">
                {questions.map((item, index) => {
                    const tipe = item.pertanyaan_screening.tipe_jawaban;

                    return (
                    <div
                        key={item.id_detail_screening}
                        className="flex justify-between items-start border-b border-gray-200 pb-2"
                    >
                        <div className="flex gap-2 max-w-[75%]">
                        <span className="font-semibold text-green-600 text-[12px]">
                            {index + 1}.
                        </span>
                        <p className="text-[12px]">
                            {item.pertanyaan_screening.pertanyaan}
                        </p>
                        </div>

                        {tipe === "NUMBER" ? (
                        <span className="font-semibold text-blue-600 text-[12px]">
                            {item.nilai_number ?? "-"} hari
                        </span>
                        ) : (
                        <span
                            className={`font-semibold text-[12px] ${
                            item.jawaban
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                        >
                            {item.jawaban ? "Ya" : "Tidak"}
                        </span>
                        )}
                    </div>
                    );
                })}
            </div>
        );
    }

<style>
{`
@media print {

  body * {
    visibility: hidden;
  }

  #paper, #paper * {
    visibility: visible;
  }

  #paper {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm;
  }

  @page {
    size: A4;
    margin: 20mm;
  }
}
`}
</style>