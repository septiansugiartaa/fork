import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";

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

export const PdfLaporanPimpinan = async (data, barChartRef, pieChartRef) => {
  if (!data) return;

  try {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true 
    });

    const margin = { left: 20, right: 20, bottom: 20 }; 
    const firstPageMarginTop = 10; 
    const normalMarginTop = 20;
    const printWidth = 210 - margin.left - margin.right;
    let cursorY = firstPageMarginTop;

    const checkPageBreak = (requiredSpace) => {
      if (cursorY + requiredSpace > 297 - margin.bottom) {
        doc.addPage();
        cursorY = normalMarginTop;
      }
    };

    const formatRupiah = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

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
    
    // JUDUL DOKUMEN & TANGGAL
    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN MANAJEMEN PIMPINAN", 105, cursorY, { align: "center" });
    
    cursorY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Tanggal Cetak: ${tglCetak}`, 105, cursorY, { align: "center" });

    cursorY += 12; 


    // 1. RINGKASAN KEUANGAN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("1. Ringkasan Keuangan", margin.left, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left + 5, right: margin.right },
      head: [['Keterangan', 'Nilai']],
      body: [
        ['Pemasukan Bulanan', formatRupiah(data.keuangan.total_pendapatan)],
        ['Tunggakan SPP', `${data.keuangan.persentase_tunggakan}% Santri`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], halign: 'center' }, 
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center' } },
      styles: { font: 'helvetica', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // Grafik Keuangan (Bar Chart)
    if (barChartRef && barChartRef.current) {
      const barCanvas = await html2canvas(barChartRef.current, { scale: 2, backgroundColor: "#FFFFFF" });
      
      const barImg = barCanvas.toDataURL("image/jpeg", 0.7);
      const imgProps = doc.getImageProperties(barImg);
      const pdfImgWidth = 120; 
      const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
      const centeredX = (210 - pdfImgWidth) / 2;

      checkPageBreak(pdfImgHeight + 10);
      
      doc.addImage(barImg, "JPEG", centeredX, cursorY, pdfImgWidth, pdfImgHeight, undefined, 'FAST');
      cursorY += pdfImgHeight + 12;
    }

    // 2. REKAPITULASI KESEHATAN SANTRI
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. Rekapitulasi Kesehatan (Screening Scabies)", margin.left, cursorY);
    cursorY += 4;

    const dataKesehatanTabel = data.kesehatan && data.kesehatan.length > 0 
      ? data.kesehatan.map(item => [item.name, `${item.value} Santri`])
      : [['Data Kosong', '-']];

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left + 5, right: margin.right },
      head: [['Kategori', 'Jumlah Santri']],
      body: dataKesehatanTabel,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], halign: 'center' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center' } },
      styles: { font: 'helvetica', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // Grafik Kesehatan (Pie Chart)
    if (pieChartRef && pieChartRef.current) {
      const pieCanvas = await html2canvas(pieChartRef.current, { scale: 2, backgroundColor: "#FFFFFF" });
      
      const pieImg = pieCanvas.toDataURL("image/jpeg", 0.7);
      const pieSize = 90; 
      const imgProps = doc.getImageProperties(pieImg);
      const pdfImgHeight = (imgProps.height * pieSize) / imgProps.width;
      const centeredX = (210 - pieSize) / 2;

      checkPageBreak(pdfImgHeight + 10);
      
      doc.addImage(pieImg, "JPEG", centeredX, cursorY, pieSize, pdfImgHeight, undefined, 'FAST');
      cursorY += pdfImgHeight + 12;
    }

    // 3. REKAPITULASI PENGADUAN
    checkPageBreak(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("3. Rekapitulasi Pengaduan", margin.left, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left + 5, right: margin.right },
      head: [['Jenis Laporan', 'Jumlah']],
      body: [
        ['Laporan Selesai', data.kedisiplinan.selesai],
        ['Laporan Aktif (Belum Ditangani)', data.kedisiplinan.aktif],
        ['Total Pengaduan', data.kedisiplinan.total_aduan]
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], halign: 'center' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center', fontStyle: 'bold' } },
      styles: { font: 'helvetica', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 12;

    // 4. INDEKS KEPUASAN SANTRI
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("4. Indeks Kepuasan Santri", margin.left, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left + 5, right: margin.right },
      head: [['Nilai Kepuasan', 'Total Ulasan']],
      body: [
        [`${data.kepuasan.rata_rata} / 5.0`, `${data.kepuasan.total_ulasan} Ulasan`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], halign: 'center' },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'center', fontStyle: 'bold' } },
      styles: { font: 'helvetica', fontSize: 10 }
    });

    // FOOTER HALAMAN
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
      doc.text(`Halaman ${i} dari ${pageCount}`, 210 - margin.right, 297 - 15, { align: "right" });
    }

    doc.save(`Laporan_Manajemen_Pimpinan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);

  } catch (error) {
    console.error("Gagal generate PDF", error);
    throw error;
  }
};