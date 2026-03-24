import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoPesantren from "../assets/logo.png";
import { formatObservasiTindakLanjut, formatObservasiWaktu, getObservasiCategory, getObservasiPdfColor } from "./UtilsObservasi";

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

export const exportObservasiPdf = async (data, observasiId, action = "download") => {
  if (!data) return null;

  try {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const margin = { left: 20, right: 20, bottom: 20 };
    const printWidth = 210 - margin.right;
    let cursorY = 15;

    const checkPageBreak = (requiredSpace) => {
      if (cursorY + requiredSpace > 297 - margin.bottom) {
        doc.addPage();
        cursorY = 20;
      }
    };

    const renderTitle = (title) => {
      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 166, 62);
      doc.text(title, margin.left, cursorY);
      doc.setTextColor(0);
      cursorY += 4;
    };

    try {
      const logo = await getBase64ImageFromUrl(logoPesantren);
      doc.addImage(logo, "PNG", margin.left, cursorY, 21, 21, undefined, "FAST");
    } catch (error) {
      console.warn("Gagal memuat logo observasi:", error);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("YAYASAN DARUNNA'IM YAPIA", 105, cursorY + 6, { align: "center" });
    doc.setFontSize(12);
    doc.text("PONDOK PESANTREN MODERN DARUN-NA'IM YAPIA", 105, cursorY + 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Jl. Demang Aria Rt. 01 Rw. 03 Desa Waru Jaya, Kec. Parung, Kab. Bogor", 105, cursorY + 15, { align: "center" });

    cursorY += 23;
    doc.setLineWidth(0.8);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin.left, cursorY, printWidth, cursorY);
    cursorY += 1;
    doc.setLineWidth(0.2);
    doc.line(margin.left, cursorY, printWidth, cursorY);

    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN OBSERVASI CUCI TANGAN SANTRI", 105, cursorY, { align: "center" });
    cursorY += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
      105,
      cursorY,
      { align: "center" }
    );
    doc.setTextColor(0);
    cursorY += 10;

    const santri = data.users_observasi_id_santriTousers;
    const timkes = data.users_observasi_id_timkesTousers;
    const kelas = santri?.kelas_santri?.[0]?.kelas?.kelas || "-";
    const kamar = santri?.kamar_santri?.[0]?.kamar?.kamar || "-";
    const score = data.total_skor || 0;
    const category = data.kategori_skor || getObservasiCategory(score);
    const scoreColor = getObservasiPdfColor(category);
    const tindakLanjutRows = [
      ...(data.tindak_lanjut || []).map((item, index) => [`${index + 1}.`, formatObservasiTindakLanjut(item)]),
      ...(data.tindak_lanjut_lainnya
        ? [[`${(data.tindak_lanjut || []).length + 1}.`, `Lainnya: ${formatObservasiTindakLanjut(data.tindak_lanjut_lainnya)}`]]
        : [])
    ];

    renderTitle("DATA SANTRI");
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left },
      theme: "plain",
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold", cellPadding: { left: 0, right: 1.5, top: 1.5, bottom: 1.5 } },
        1: { cellWidth: 5 },
        2: { cellWidth: 120 }
      },
      body: [
        ["Nama Lengkap", ":", santri?.nama || "-"],
        ["NIS", ":", santri?.nip || "-"],
        ["Kelas / Kamar", ":", `${kelas} / ${kamar}`],
        ["Tanggal Observasi", ":", data.tanggal ? new Date(data.tanggal).toLocaleDateString("id-ID") : "-"],
        ["Waktu Observasi", ":", formatObservasiWaktu(data.waktu)],
        ["Pengamat", ":", timkes?.nama || "-"]
      ]
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    renderTitle("A. HASIL OBSERVASI");
    autoTable(doc, {
      startY: cursorY,
      body: (data.detail_observasi || []).map((item, index) => [
        `${index + 1}.`,
        item.pertanyaan_observasi?.pertanyaan || "-",
        item.jawaban ? "Ya" : "Tidak"
      ]),
      margin: { left: margin.left, right: margin.right },
      theme: "plain",
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 1, right: 1 } },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: "bold", textColor: [0, 166, 62] },
        1: { cellWidth: 125, textColor: [55, 65, 81] },
        2: { cellWidth: 35, halign: "right", fontStyle: "bold" }
      },
      willDrawCell: (tableData) => {
        if (tableData.column.index === 2 && tableData.section === "body") {
          doc.setTextColor(tableData.cell.raw === "Ya" ? 21 : 220, tableData.cell.raw === "Ya" ? 128 : 38, tableData.cell.raw === "Ya" ? 61 : 38);
        }
      },
      didDrawCell: (tableData) => {
        if (tableData.section === "body") {
          doc.setDrawColor(243, 244, 246);
          doc.setLineWidth(0.2);
          doc.line(tableData.cell.x, tableData.cell.y + tableData.cell.height, tableData.cell.x + tableData.cell.width, tableData.cell.y + tableData.cell.height);
        }
      }
    });
    cursorY = doc.lastAutoTable.finalY + 10;

    renderTitle("B. SKOR PENILAIAN");
    autoTable(doc, {
      startY: cursorY,
      head: [["Kategori", "Skor", "Keterangan"]],
      body: [
        ["Baik", "6-7", "Perilaku cuci tangan santri sudah sesuai standar"],
        ["Cukup", "4-5", "Perlu diingatkan dan dibimbing ulang"],
        ["Kurang", "<=3", "Perlu dilakukan edukasi ulang oleh Tim Mutu Kesehatan"]
      ],
      margin: { left: margin.left, right: margin.right },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 2.2, valign: "middle" }
    });
    cursorY = doc.lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...scoreColor);
    doc.text(`Skor Otomatis: ${score} - ${category}`, margin.left, cursorY);
    doc.setTextColor(0);
    cursorY += 10;

    renderTitle("C. CATATAN PENGAMAT");
    autoTable(doc, {
      startY: cursorY,
      theme: "grid",
      margin: { left: margin.left, right: margin.right },
      styles: { fontSize: 9, cellPadding: 3 },
      body: [[data.catatan_pengamat || "Tidak ada catatan pengamat."]]
    });
    cursorY = doc.lastAutoTable.finalY + 10;

    renderTitle("D. TINDAK LANJUT");
    autoTable(doc, {
      startY: cursorY,
      theme: "plain",
      margin: { left: margin.left },
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 1.5, textColor: [55, 65, 81] },
      columnStyles: {
        0: { cellWidth: 10, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 1.5 } },
        1: { cellWidth: 160 }
      },
      body: tindakLanjutRows.length > 0 ? tindakLanjutRows : [["1.", "Tidak ada tindak lanjut"]]
    });
    cursorY = doc.lastAutoTable.finalY + 12;

    checkPageBreak(30);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9.5);
    doc.text("Nama Pemeriksa", margin.left, cursorY);
    doc.text(`: ${timkes?.nama || "-"}`, margin.left + 35, cursorY);
    cursorY += 5;

    doc.text("Jabatan", margin.left, cursorY);
    doc.text(": Tim Kesehatan", margin.left + 35, cursorY);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150);
      doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
      doc.text(`Halaman ${i} dari ${pageCount}`, printWidth, 297 - 15, { align: "right" });
    }

    if (action === "preview") {
      return doc.output("bloburl");
    }

    doc.save(`Laporan_Observasi_${santri?.nama?.replace(/\s+/g, "_") || observasiId}.pdf`);
    return null;
  } catch (error) {
    console.error("Gagal generate PDF observasi", error);
    alert("Gagal mengunduh dokumen PDF.");
    return null;
  }
};