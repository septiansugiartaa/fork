import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoPesantren from "../assets/logo-border.png";

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

const getStatusColor = (status) => {
  if (!status) return [156, 163, 175]; // gray
  const s = status.toLowerCase();
  if (s.includes('selesai') || s.includes('diterima')) return [22, 163, 74]; // green
  if (s.includes('batal') || s.includes('tolak')) return [220, 38, 38]; // red
  return [234, 179, 8]; // yellow
};

export const PdfRiwayatLayanan = async (detail, santriNama) => {
  if (!detail) return;

  try {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const margin = { left: 20, right: 20, bottom: 20 };
    const printWidth = 210 - margin.left - margin.right;
    let cursorY = 10;

    const checkPageBreak = (requiredSpace) => {
      if (cursorY + requiredSpace > 297 - margin.bottom) {
        doc.addPage();
        cursorY = 20;
      }
    };

    // KOP SURAT
    // a. Sisipkan Logo di pojok kiri Kop Surat
    try {
      const logoBase64 = await getBase64ImageFromUrl(logoPesantren);
      doc.addImage(logoBase64, "PNG", margin.left, cursorY, 21, 21, undefined, 'FAST');
    } catch (error) {
      console.warn("Gagal memuat logo kop surat:", error);
    }

    // b. Teks Kop Surat 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("YAYASAN DARUNNA'IM YAPIA", 105, cursorY + 6, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("PONDOK PESANTREN MODERN DARUN-NA'IM YAPIA", 105, cursorY + 11, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Jl. Demang Aria Rt. 01 Rw. 03 Desa Waru Jaya, Kec. Parung, Kab. Bogor", 105, cursorY + 15, { align: "center" });
    doc.text("Email: ponpesmodern.darunnaimyapia@gmail.com | IG: @ponpes_modern_darun_naim_yapia", 105, cursorY + 18, { align: "center" });

    // c. Garis Bawah Kop Surat
    cursorY += 23; 
    doc.setLineWidth(0.8);
    doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
    cursorY += 1;
    doc.setLineWidth(0.2);
    doc.line(margin.left, cursorY, 210 - margin.right, cursorY);

    // ─── JUDUL ───────────────────────────────────────────────────
    cursorY += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("RINCIAN RIWAYAT LAYANAN", 105, cursorY, { align: "center" });
    cursorY += 12;

    // ─── INFO HEADER ─────────────────────────────────────────────
    const statusText = detail.status_sesudah || "Diproses";
    const statusColor = getStatusColor(statusText);
    const tgl = detail.waktu
      ? new Date(detail.waktu).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "-";

    const headerData = [
      ["Jenis Layanan", detail.jenis_layanan?.nama_layanan || "-"],
      ["Nama Santri", santriNama || "-"],
      ["Tanggal Pengajuan", tgl],
      ["Status", statusText],
    ];

    autoTable(doc, {
      startY: cursorY,
      head: [],
      body: headerData,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2.5, textColor: [31, 41, 55] },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: [107, 114, 128] },
        1: { cellWidth: printWidth - 50 },
      },
      margin: { left: margin.left, right: margin.right },
      didParseCell: (data) => {
        if (data.row.index === 3 && data.column.index === 1) {
          data.cell.styles.textColor = statusColor;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    cursorY = doc.lastAutoTable.finalY + 6;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
    cursorY += 6;

    // ─── DETAIL FORM ─────────────────────────────────────────────
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text("DETAIL PENGAJUAN", margin.left, cursorY);
    cursorY += 5;

    if (detail.riwayat_layanan_detail && detail.riwayat_layanan_detail.length > 0) {
      const detailRows = detail.riwayat_layanan_detail.map((item) => [item.aspek, item.detail]);

      autoTable(doc, {
        startY: cursorY,
        head: [["Aspek", "Keterangan"]],
        body: detailRows,
        theme: "striped",
        headStyles: {
          fillColor: [22, 163, 74],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9.5, textColor: [31, 41, 55] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 55, textColor: [107, 114, 128] },
          1: { cellWidth: printWidth - 55 },
        },
        margin: { left: margin.left, right: margin.right },
      });
      cursorY = doc.lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(156, 163, 175);
      doc.text("Tidak ada detail form.", margin.left, cursorY + 4);
      cursorY += 10;
    }

    // ─── CATATAN PETUGAS ─────────────────────────────────────────
    if (detail.catatan) {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("CATATAN PETUGAS", margin.left, cursorY);
      cursorY += 5;

      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(margin.left, cursorY, printWidth, 12, 2, 2, "FD");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(21, 128, 61);
      const catatanLines = doc.splitTextToSize(detail.catatan, printWidth - 8);
      doc.text(catatanLines, margin.left + 4, cursorY + 5);
      cursorY += 14 + (catatanLines.length - 1) * 5;
    }

    // ─── FOOTER ──────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(`Dicetak oleh SIM-TREN · ${new Date().toLocaleDateString("id-ID")} · Halaman ${i} dari ${pageCount}`, 105, 290, { align: "center" });
    }

    const namaFile = `Riwayat_Layanan_${(detail.jenis_layanan?.nama_layanan || "Layanan").replace(/\s+/g, "_")}_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.pdf`;
    doc.save(namaFile);
  } catch (err) {
    console.error("Gagal generate PDF:", err);
    throw err;
  }
};
