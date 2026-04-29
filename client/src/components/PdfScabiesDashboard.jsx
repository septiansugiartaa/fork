import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";

import logoPesantren from "../assets/logo.png";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const margin = { left: 20, right: 20, bottom: 20 };

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getBase64ImageFromUrl = async (imageUrl) => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getDiagnosisRate = (part, total) => {
  if (!total) return "0%";
  return `${Math.round((Number(part || 0) / Number(total || 0)) * 100)}%`;
};

const getMonthlyInsightRows = (monthlyData = []) => {
  const nonEmptyRows = monthlyData.filter((row) => Number(row.total || 0) > 0);
  if (!nonEmptyRows.length) {
    return [
      ["1", "Data screening tahun berjalan belum tersedia sehingga tren bulanan belum dapat dianalisis."],
    ];
  }

  const highestScabies = [...nonEmptyRows].sort(
    (a, b) => Number(b.terkena_scabies || 0) - Number(a.terkena_scabies || 0)
  )[0];
  const highestSafe = [...nonEmptyRows].sort(
    (a, b) => Number(b.tidak_terpapar || 0) - Number(a.tidak_terpapar || 0)
  )[0];
  const highestEvaluation = [...nonEmptyRows].sort(
    (a, b) => Number(b.perlu_evaluasi || 0) - Number(a.perlu_evaluasi || 0)
  )[0];

  return [
    [
      "1",
      `Kasus scabies tertinggi terjadi pada ${highestScabies.month} dengan ${formatNumber(
        highestScabies.terkena_scabies
      )} santri dari ${formatNumber(highestScabies.total)} screening terakhir.`,
    ],
    [
      "2",
      `Status aman tertinggi tercatat pada ${highestSafe.month} dengan ${formatNumber(
        highestSafe.tidak_terpapar
      )} santri berstatus bukan scabies.`,
    ],
    [
      "3",
      `Kasus evaluasi lanjutan paling banyak ada di ${highestEvaluation.month} sebanyak ${formatNumber(
        highestEvaluation.perlu_evaluasi
      )} santri dan layak diprioritaskan untuk pemantauan.`,
    ],
  ];
};

const getYearlyPriorityRows = (yearlyData = []) => {
  const rows = yearlyData.filter((row) => Number(row.total || 0) > 0);
  if (!rows.length) {
    return [
      ["1", "Belum ada data tahunan yang cukup untuk membentuk ringkasan prioritas kasus scabies."],
    ];
  }

  const highestScabies = [...rows].sort(
    (a, b) => Number(b.terkena_scabies || 0) - Number(a.terkena_scabies || 0)
  )[0];
  const highestEvaluation = [...rows].sort(
    (a, b) => Number(b.perlu_evaluasi || 0) - Number(a.perlu_evaluasi || 0)
  )[0];
  const safestYear = [...rows].sort(
    (a, b) => Number(b.tidak_terpapar || 0) - Number(a.tidak_terpapar || 0)
  )[0];

  return [
    [
      "1",
      `Tahun dengan kasus scabies tertinggi adalah ${highestScabies.year} dengan ${formatNumber(
        highestScabies.terkena_scabies
      )} santri.`,
    ],
    [
      "2",
      `Tahun dengan kebutuhan evaluasi lanjutan tertinggi adalah ${highestEvaluation.year} sebanyak ${formatNumber(
        highestEvaluation.perlu_evaluasi
      )} santri.`,
    ],
    [
      "3",
      `Tahun dengan hasil paling aman adalah ${safestYear.year} dengan ${formatNumber(
        safestYear.tidak_terpapar
      )} santri berstatus bukan scabies.`,
    ],
  ];
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", PAGE_WIDTH / 2, PAGE_HEIGHT - 15, {
      align: "center",
    });
    doc.text(`Halaman ${i} dari ${pageCount}`, PAGE_WIDTH - margin.right, PAGE_HEIGHT - 15, {
      align: "right",
    });
  }
};

const addLetterhead = async (doc, title) => {
  const printRightEdge = PAGE_WIDTH - margin.right;
  let cursorY = 15;

  try {
    const logoBase64 = await getBase64ImageFromUrl(logoPesantren);
    doc.addImage(logoBase64, "PNG", margin.left, cursorY, 21, 21, undefined, "FAST");
  } catch (error) {
    console.warn("Gagal memuat logo laporan scabies:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("YAYASAN DARUNNA'IM YAPIA", PAGE_WIDTH / 2, cursorY + 6, { align: "center" });
  doc.setFontSize(12);
  doc.text("PONDOK PESANTREN MODERN DARUN-NA'IM YAPIA", PAGE_WIDTH / 2, cursorY + 11, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Jl. Demang Aria Rt. 01 Rw. 03 Desa Waru Jaya, Kec. Parung, Kab. Bogor",
    PAGE_WIDTH / 2,
    cursorY + 15,
    { align: "center" }
  );

  cursorY += 23;
  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 0, 0);
  doc.line(margin.left, cursorY, printRightEdge, cursorY);
  cursorY += 1;
  doc.setLineWidth(0.2);
  doc.line(margin.left, cursorY, printRightEdge, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, PAGE_WIDTH / 2, cursorY, { align: "center" });
  cursorY += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text(
    `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    PAGE_WIDTH / 2,
    cursorY,
    { align: "center" }
  );
  doc.setTextColor(0);

  return cursorY + 10;
};

const captureChartImage = async (chartRef) => {
  if (!chartRef?.current) return null;

  const canvas = await html2canvas(chartRef.current, {
    scale: 2,
    backgroundColor: "#FFFFFF",
  });

  return canvas.toDataURL("image/jpeg", 0.86);
};

const addSectionTitle = (doc, cursorY, title) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 166, 62);
  doc.text(title, margin.left, cursorY);
  doc.setTextColor(0);
  return cursorY + 4;
};

const addChartImage = (doc, cursorY, imageData) => {
  if (!imageData) return cursorY;

  const imgProps = doc.getImageProperties(imageData);
  const width = 160;
  const height = (imgProps.height * width) / imgProps.width;
  const startX = (PAGE_WIDTH - width) / 2;

  doc.addImage(imageData, "JPEG", startX, cursorY, width, height, undefined, "FAST");
  return cursorY + height + 8;
};

export const exportMonthlyScabiesPdf = async ({ summary, chartData, detail, chartRef }) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  let cursorY = await addLetterhead(doc, "LAPORAN BULANAN ANALITIK SCABIES");
  const chartImage = await captureChartImage(chartRef);

  cursorY = addSectionTitle(doc, cursorY, "DATA RINGKAS");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    theme: "grid",
    head: [["Indikator", "Nilai"]],
    body: [
      ["Total Screening Terakhir", formatNumber(summary?.total_screening_terakhir)],
      ["Terkena Scabies", formatNumber(summary?.terkena_scabies)],
      ["Perlu Evaluasi Lanjutan", formatNumber(summary?.perlu_evaluasi)],
      ["Tidak Terpapar", formatNumber(summary?.tidak_terpapar)],
    ],
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  cursorY = addSectionTitle(doc, cursorY, "GRAFIK BULANAN");
  cursorY = addChartImage(doc, cursorY, chartImage);

  cursorY = addSectionTitle(doc, cursorY, "INSIGHT UTAMA");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    theme: "plain",
    body: getMonthlyInsightRows(chartData),
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", textColor: [22, 163, 74] },
      1: { cellWidth: 160, textColor: [55, 65, 81] },
    },
    styles: { fontSize: 9.2, cellPadding: { top: 2, bottom: 2, left: 0, right: 1 } },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  const statusTables = [
    { title: "TABEL STATUS SCABIES", rows: detail?.scabies || [], color: [220, 38, 38] },
    {
      title: "TABEL STATUS KEMUNGKINAN SCABIES / EVALUASI LANJUTAN",
      rows: detail?.evaluasi || [],
      color: [217, 119, 6],
    },
    { title: "TABEL STATUS BUKAN SCABIES", rows: detail?.bukan_scabies || [], color: [22, 163, 74] },
  ];

  statusTables.forEach((section) => {
    if (cursorY > PAGE_HEIGHT - 90) {
      doc.addPage();
      cursorY = 20;
    }

    cursorY = addSectionTitle(doc, cursorY, section.title);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left, right: margin.right },
      head: [["No", "Nama Santri", "Tanggal Screening Terakhir", "Kamar", "Kelas"]],
      body:
        section.rows.length > 0
          ? section.rows.map((row, index) => [
              index + 1,
              row.nama || "-",
              formatDate(row.tanggal),
              row.kamar || "-",
              row.kelas || "-",
            ])
          : [["-", "Tidak ada data untuk kategori ini.", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: section.color, textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.7, cellPadding: 2.2, valign: "middle" },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 42 },
      },
    });
    cursorY = doc.lastAutoTable.finalY + 8;
  });

  addFooter(doc);
  doc.save(`Laporan_Bulanan_Scabies_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.pdf`);
};

export const exportYearlyScabiesPdf = async ({ summary, chartData, detail, chartRef }) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  let cursorY = await addLetterhead(doc, "LAPORAN TAHUNAN ANALITIK SCABIES");
  const chartImage = await captureChartImage(chartRef);

  const populatedRows = (detail || []).filter((row) => Number(row.total || 0) > 0);
  const totalFiveYears = populatedRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const totalScabies = populatedRows.reduce((sum, row) => sum + Number(row.terkena_scabies || 0), 0);
  const totalEvaluation = populatedRows.reduce((sum, row) => sum + Number(row.perlu_evaluasi || 0), 0);

  cursorY = addSectionTitle(doc, cursorY, "RINGKASAN STRATEGIS");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    theme: "grid",
    head: [["Indikator", "Nilai"]],
    body: [
      ["Total Screening Terakhir Aktif", formatNumber(summary?.total_screening_terakhir)],
      ["Akumulasi Screening Dalam Rekap Tahunan", formatNumber(totalFiveYears)],
      ["Akumulasi Kasus Scabies", formatNumber(totalScabies)],
      ["Akumulasi Kasus Evaluasi", formatNumber(totalEvaluation)],
    ],
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  cursorY = addSectionTitle(doc, cursorY, "GRAFIK TAHUNAN");
  cursorY = addChartImage(doc, cursorY, chartImage);

  cursorY = addSectionTitle(doc, cursorY, "RINGKASAN PRIORITAS");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    theme: "plain",
    body: getYearlyPriorityRows(chartData),
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", textColor: [22, 163, 74] },
      1: { cellWidth: 160, textColor: [55, 65, 81] },
    },
    styles: { fontSize: 9.2, cellPadding: { top: 2, bottom: 2, left: 0, right: 1 } },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  if (cursorY > PAGE_HEIGHT - 120) {
    doc.addPage();
    cursorY = 20;
  }

  cursorY = addSectionTitle(doc, cursorY, "TABEL REKAP TAHUNAN");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    head: [["No", "Tahun", "Total", "Scabies", "Evaluasi", "Bukan Scabies", "Rasio Scabies"]],
    body:
      populatedRows.length > 0
        ? populatedRows.map((row, index) => [
            index + 1,
            row.year,
            formatNumber(row.total),
            formatNumber(row.terkena_scabies),
            formatNumber(row.perlu_evaluasi),
            formatNumber(row.tidak_terpapar),
            getDiagnosisRate(row.terkena_scabies, row.total),
          ])
        : [["-", "-", "-", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2.1, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  cursorY = addSectionTitle(doc, cursorY, "TABEL INDIKATOR TAHUN PRIORITAS");
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin.left, right: margin.right },
    head: [["No", "Tahun", "Kasus Scabies", "Evaluasi", "Bukan Scabies", "Catatan"]],
    body:
      populatedRows.length > 0
        ? populatedRows.map((row, index) => [
            index + 1,
            row.year,
            formatNumber(row.terkena_scabies),
            formatNumber(row.perlu_evaluasi),
            formatNumber(row.tidak_terpapar),
            Number(row.perlu_evaluasi || 0) > 0
              ? "Perlu pemantauan lanjutan pada kasus evaluasi."
              : "Status tahunan relatif stabil.",
          ])
        : [["-", "-", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 8.4, cellPadding: 2.1, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  addFooter(doc);
  doc.save(`Laporan_Tahunan_Scabies_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.pdf`);
};
