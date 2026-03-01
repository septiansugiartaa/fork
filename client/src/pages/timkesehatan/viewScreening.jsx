import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
        const token = localStorage.getItem("token");

        const res = await axios.get(
            `http://localhost:3000/api/timkesehatan/screening/${screeningId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

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
    const timkes = data.users_screening_id_timkesTousers;

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

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

        pdf.save(`Laporan-Screening-${screeningId}.pdf`);
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
                        href={`http://localhost:3000/uploads/screening/${data.foto_predileksi}`}
                        target="_blank"
                        rel="noreferrer"
                        >
                            <img
                                src={`http://localhost:3000/uploads/screening/${data.foto_predileksi}`}
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
                    <p className="font-semibold text-black text-[12px]">
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
                <ul className="list-decimal ml-6 mb-10 space-y-1">
                    {data.screening_penanganan.map((p) => (
                    <li key={p.id} className="text-[12px]">
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
                        <p>: {timkes?.nama}</p>
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
            <div className="flex">
            <p className="w-40">{label}</p>
            <p>: {value || "-"}</p>
            </div>
        );
    }

    function QuestionList({ questions }) {
    return (
        <div className="mb-8 space-y-3">
            {questions.map((item, index) => (
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

                    <span
                        className={`font-semibold ${
                        item.jawaban
                            ? "text-green-600 text-[12px]"
                            : "text-red-500 text-[12px]"
                        }`}
                    >
                        {item.jawaban ? "Ya" : "Tidak"}
                    </span>
                </div>
            ))}
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