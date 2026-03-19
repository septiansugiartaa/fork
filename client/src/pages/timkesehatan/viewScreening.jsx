import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import { Loader2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import logoPesantren from "../../assets/logo.png";

const AREA_LABEL = {
  kepala: "Kepala",
  leher: "Leher",
  dada: "Dada",
  perut: "Perut",
  tangan_kiri: "Tangan Kiri",
  tangan_kanan: "Tangan Kanan",
  selangkangan: "Selangkangan",
  paha_kiri: "Paha Kiri",
  paha_kanan: "Paha Kanan",
  betis_kiri: "Betis Kiri",
  betis_kanan: "Betis Kanan"
};

const BENTUK_LABEL = {
  Ruam_Merah: "Ruam merah",
  Bintil_Merah_Kecil: "Bintil merah kecil",
  Terowongan_Kecil_di_Kulit: "Terowongan kecil di kulit",
  Bintil_Bernanah: "Bintil bernanah"
};

export default function ViewScreening() {
  const { screeningId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paginatedBlocks, setPaginatedBlocks] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const measurementBodyRef = useRef(null);
  const measurementBlockRefs = useRef({});

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get(`/timkesehatan/screening/${screeningId}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data screening");
    } finally {
      setLoading(false);
    }
  }, [screeningId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  handleResize();
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

  const predileksi = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.screening_predileksi) && data.screening_predileksi.length > 0) {
      return data.screening_predileksi;
    }

    try {
      const parsed = data.catatan ? JSON.parse(data.catatan) : null;
      return (parsed?.area_predileksi || []).map((area) => ({ area, bentuk_kelainan: "Ruam_Merah" }));
    } catch {
      return [];
    }
  }, [data]);

  const blocks = useMemo(() => {
    if (!data) return [];

    const bagianA = data.detail_screening.filter((d) => d.pertanyaan_screening.bagian === "A");
    const bagianB = data.detail_screening.filter((d) => d.pertanyaan_screening.bagian === "B");

    return [
      { key: "data-santri-title", type: "sectionTitle", title: "DATA SANTRI" },
      { key: "data-santri-body", type: "dataSantri" },
      { key: "bagian-a-title", type: "sectionTitle", title: "A. RIWAYAT 14 - 30 HARI TERAKHIR" },
      ...bagianA.map((item, index) => ({ key: `a-${item.id_detail_screening}`, type: "question", index, item })),
      { key: "bagian-b-title", type: "sectionTitle", title: "B. GEJALA YANG DIALAMI" },
      ...bagianB.map((item, index) => ({ key: `b-${item.id_detail_screening}`, type: "question", index, item })),
      { key: "predileksi-section", type: "predileksiSection", title: "C. AREA PREDILEKSI DAN BENTUK KELAINAN KULIT", predileksi },
      { key: "diagnosa-title", type: "sectionTitle", title: "D. DIAGNOSA" },
      { key: "diagnosa-body", type: "diagnosa", value: data.diagnosa },
      { key: "penanganan-title", type: "sectionTitle", title: "E. PENANGANAN" },
      ...(data.screening_penanganan || []).map((item, index) => ({
        key: `penanganan-${item.id}`,
        type: "penangananItem",
        index,
        item
      })),
      { key: "pemeriksa-footer", type: "pemeriksa" }
    ];
  }, [data, predileksi]);

  const exportPages = paginatedBlocks.length ? paginatedBlocks : [blocks];

  useLayoutEffect(() => {
    if (!data || blocks.length === 0 || !measurementBodyRef.current) return;

    const frame = requestAnimationFrame(() => {
      const bodyHeight = measurementBodyRef.current?.getBoundingClientRect().height || 0;
      if (!bodyHeight) return;

      const blockHeights = Object.fromEntries(
        blocks.map((block) => {
          const node = measurementBlockRefs.current[block.key];
          return [block.key, node?.getBoundingClientRect().height || 0];
        })
      );

      const pages = [];
      let currentPage = [];
      let usedHeight = 0;

      blocks.forEach((block, index) => {
        const blockHeight = blockHeights[block.key] || 0;
        const nextBlock = blocks[index + 1];
        const keepWithNextHeight =
          block.type === "sectionTitle" && nextBlock
            ? blockHeight + (blockHeights[nextBlock.key] || 0)
            : blockHeight;

        if (currentPage.length > 0 && usedHeight + keepWithNextHeight > bodyHeight) {
          pages.push(currentPage);
          currentPage = [];
          usedHeight = 0;
        }

        currentPage.push(block);
        usedHeight += blockHeight;
      });

      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      setPaginatedBlocks(pages);
    });

    return () => cancelAnimationFrame(frame);
  }, [blocks, data]);

  const handleDownload = async () => {
    const pages = document.querySelectorAll(".pdf-export-page");
    if (!pages.length) return;

    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight > pageHeight ? pageHeight : imgHeight);
    }

    pdf.save(`Laporan-Screening-${screeningId}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

  if (!data) return null;

  const santri = data.users_screening_id_santriTousers;

  const pagesToRender = isMobile
  ? [blocks]
  : paginatedBlocks.length > 0
    ? paginatedBlocks
    : [blocks];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
        <div />
      </div>

      <div className="overflow-x-auto pb-20 space-y-6">
        {pagesToRender.map((pageBlocks, pageIndex) => (
          <ScreeningPage
            key={`page-${pageIndex + 1}`}
            blocks={pageBlocks}
            data={data}
            predileksi={predileksi}
            pageNumber={pageIndex + 1}
            totalPages={pagesToRender.length}
          />
        ))}
      </div>

      <div className="fixed top-0 left-0 z-[-1] w-[210mm]">
        <MeasurementPage
          bodyRef={measurementBodyRef}
          blockRefs={measurementBlockRefs}
          blocks={blocks}
          data={data}
          predileksi={predileksi}
        />
      </div>

      <div className="fixed top-0 left-0 z-[-1] w-[210mm]">
        {exportPages.map((pageBlocks, pageIndex) => (
          <ScreeningPage
            key={`export-page-${pageIndex + 1}`}
            blocks={pageBlocks}
            data={data}
            predileksi={predileksi}
            pageNumber={pageIndex + 1}
            totalPages={exportPages.length}
            exportMode
          />
        ))}
      </div>

      <button
        onClick={handleDownload}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg print:hidden"
      >
        Download PDF
      </button>
    </div>
  );
}

function MeasurementPage({ bodyRef, blockRefs, blocks, data, predileksi }) {
  return (
    <div
      style={{ width: "210mm", height: "297mm" }}
      className="bg-white px-10 py-8 pb-[12mm] text-sm flex flex-col overflow-hidden"
    >
      <Header />

      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-black tracking-wide">LAPORAN HASIL SCREENING KESEHATAN</h1>
        <p className="text-[11px] text-gray-500 italic">
          Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      <div ref={bodyRef} className="flex-1 overflow-hidden">
        {blocks.map((block) => (
          <div
            key={block.key}
            ref={(node) => {
              blockRefs.current[block.key] = node;
            }}
            className="flow-root"
          >
            <RenderBlock block={block} data={data} predileksi={predileksi} />
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-gray-200 pt-2 text-[11px] text-gray-500 flex items-center justify-between italic">
        <span>Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.</span>
        <span>Halaman 1 dari 1</span>
      </div>
    </div>
  );
}

function ScreeningPage({ blocks, data, predileksi, pageNumber, totalPages, exportMode = false }) {
  return (
    <div
      className={`
        ${exportMode 
          ? "pdf-export-page w-[210mm] h-[297mm] px-10 flex flex-col" 
          : "pdf-page w-full max-w-[210mm] px-6 sm:px-10"
        }
        bg-white py-8 pb-[12mm] shadow-2xl text-sm mx-auto flex flex-col
      `}
    >
      <Header />

      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-black tracking-wide">LAPORAN HASIL SCREENING KESEHATAN</h1>
        <p className="text-[11px] text-gray-500 italic">
          Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col h-full">
        {blocks.map((block) => (
          <RenderBlock key={block.key} block={block} data={data} predileksi={predileksi} />
        ))}
      </div>
      </div>

      <div className="mt-auto border-t border-gray-200 pt-2 text-[11px] text-gray-500 flex items-center justify-between italic">
        <span>Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.</span>
        <span>Halaman {pageNumber} dari {totalPages}</span>
      </div>
    </div>
  );
}

function RenderBlock({ block, data, predileksi }) {
  const santri = data.users_screening_id_santriTousers;
  const timkesehatan = data.users_screening_id_timkesTousers;
  const kelas = santri?.kelas_santri?.[0]?.kelas?.kelas || "-";
  const kamar = santri?.kamar_santri?.[0]?.kamar?.kamar || "-";

  if (block.type === "sectionTitle") {
    return <SectionTitle title={block.title} />;
  }

  if (block.type === "dataSantri") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2 mb-8 text-sm">
        <DataRow label="Nama" value={santri?.nama} />
        <DataRow label="NIS" value={santri?.nip} />
        <DataRow label="Kamar" value={kamar} />
        <DataRow label="Pendidikan" value={kelas} />
        <DataRow label="Tanggal Pemeriksaan" value={data.tanggal ? new Date(data.tanggal).toLocaleDateString("id-ID") : "-"} />
      </div>
    );
  }

  if (block.type === "question") {
    return (
      <div>
        <QuestionRow item={block.item} index={block.index} />
        <QuestionRow item={block.item} index={block.index} />
      </div>
    );
  }

  if (block.type === "predileksiSection") {
    return (
      <div>
        <SectionTitle title={block.title} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
          <div>
            <AnatomiPreview predileksi={predileksi} />
          </div>
          <div className="md:col-span-2 space-y-2">
            {predileksi.length > 0 ? (
              predileksi.map((item) => (
                <div
                  key={`${item.area}-${item.id_predileksi || item.bentuk_kelainan || "none"}`}
                  className="border-b border-gray-200 pb-2 text-[12px]"
                >
                  <span className="font-semibold text-green-700">{AREA_LABEL[item.area] || item.area}</span>
                  <span className="text-gray-700"> — Bentuk kelainan kulit: {BENTUK_LABEL[item.bentuk_kelainan] || "-"}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-[12px]">Tidak ada area yang dipilih</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "diagnosa") {
    return (
      <div className="mb-8">
        <p className={`${getDiagnosaStyle(block.value)} text-[12px]`}>
          {block.value.replaceAll("_", " ")}
        </p>
      </div>
    );
  }

  if (block.type === "penangananItem") {
    return (
      <div className="mb-2 text-[12px] list-decimal list-outside ml-4">
        {block.index + 1}. {block.item.penanganan.opsi_penanganan}
      </div>
    );
  }

  if (block.type === "pemeriksa") {
    return (
      <div className="space-y-2 text-[12px] mt-8">
        <div className="flex">
          <p className="w-40">Nama Pemeriksa</p>
          <p>: {timkesehatan?.nama || "-"}</p>
        </div>

        <div className="flex">
          <p className="w-40">Jabatan</p>
          <p>: Tim Kesehatan</p>
        </div>
      </div>
    );
  }

  return null;
}

function Header() {
  return (
    <div className="relative border-b-2 border-black pb-3 mb-7">
      <img src={logoPesantren} alt="Logo" className="absolute left-0 top-1 w-14 h-14" />
      <div className="text-center pl-16 sm:pl-0">
        <p className="text-[10px] font-bold">YAYASAN DARUNNA'IM YAPIA</p>
        <p className="text-[14px] font-bold">PONDOK PESANTREN MODERN DARUN-NA'IM YAPIA</p>
        <p className="text-[9px]">Jl. Demang Aria Rt.01 Rw.03 Desa Waru Jaya, Kec. Parung, Kab. Bogor</p>
        <p className="text-[9px]">Email: ponpesmodern.darunnaimyapia@gmail.com | IG: @ponpes_modern_darun_naim_yapia</p>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="mb-4">
      <h2 className="text-green-600 font-bold tracking-wide text-[14px]">{title}</h2>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex text-[12px]">
      <p className="w-40">{label}</p>
      <p>: {value || "-"}</p>
    </div>
  );
}

function QuestionRow({ item, index }) {
  const tipe = item.pertanyaan_screening.tipe_jawaban;
  const answerClass = tipe === "NUMBER"
    ? "text-blue-600"
    : item.jawaban
      ? "text-green-600"
      : "text-red-500";

  return (
    <div className="mb-3">
      <div className="flex justify-between items-start border-b border-gray-200 pb-2">
        <div className="flex gap-2 max-w-[75%]">
          <span className="font-semibold text-green-600 text-[12px]">{index + 1}.</span>
          <p className="text-[12px]">{item.pertanyaan_screening.pertanyaan}</p>
        </div>
        <span className={`font-semibold text-[12px] ${answerClass}`}>
          {tipe === "NUMBER" ? `${item.nilai_number ?? "-"} hari` : item.jawaban ? "Ya" : "Tidak"}
        </span>
      </div>
    </div>
  );
}

function AnatomiPreview({ predileksi, compact = false }) {
  const activeAreas = new Set((predileksi || []).map((item) => item.area));
  const isActiveArea = (key) => activeAreas.has(key);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-2 flex justify-center">
      <svg viewBox="0 0 160 380" className={compact ? "w-20 h-auto" : "w-28 h-auto"}>
        <circle cx="80" cy="30" r="18" fill={isActiveArea("kepala") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="72" y="48" width="16" height="14" rx="6" fill={isActiveArea("leher") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="50" y="62" width="60" height="44" rx="20" fill={isActiveArea("dada") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="58" y="104" width="44" height="46" rx="18" fill={isActiveArea("perut") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="30" y="70" width="18" height="95" rx="10" fill={isActiveArea("tangan_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="112" y="70" width="18" height="95" rx="10" fill={isActiveArea("tangan_kanan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="66" y="150" width="28" height="30" rx="12" fill={isActiveArea("selangkangan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="52" y="178" width="22" height="80" rx="12" fill={isActiveArea("paha_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="86" y="178" width="22" height="80" rx="12" fill={isActiveArea("paha_kanan") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="56" y="258" width="16" height="92" rx="10" fill={isActiveArea("betis_kiri") ? "#ff0c0c" : "#d1d5db"} />
        <rect x="88" y="258" width="16" height="92" rx="10" fill={isActiveArea("betis_kanan") ? "#ff0c0c" : "#d1d5db"} />
      </svg>
    </div>
  );
}

function getDiagnosaStyle(diagnosa) {
  if (!diagnosa) return "text-gray-500";
  if (diagnosa === "Scabies") return "text-red-600 font-semibold";
  if (diagnosa === "Bukan_Scabies") return "text-green-600 font-semibold";
  if (diagnosa === "Kemungkinan_Scabies" || diagnosa === "Perlu_Evaluasi_Lebih_Lanjut") {
    return "text-yellow-600 font-semibold";
  }
  return "text-gray-600";
}