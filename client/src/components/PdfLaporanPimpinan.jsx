import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";

export const PdfLaporanPimpinan = async (data, barChartRef, pieChartRef) => {
  if (!data) return;

  try {
    // 1. OPTIMASI
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true 
    });

    const margin = { left: 30, top: 20, right: 30, bottom: 25 }; 
    const printWidth = 210 - margin.left - margin.right;
    let cursorY = margin.top;

    const checkPageBreak = (requiredSpace) => {
      if (cursorY + requiredSpace > 297 - margin.bottom) {
        doc.addPage();
        cursorY = margin.top;
      }
    };

    const formatRupiah = (angka) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);


    // KOP SURAT
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN PIMPINAN", 105, cursorY, { align: "center" });
    
    cursorY += 6;
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text("Sistem Informasi Manajemen Pondok Pesantren (SIM-Tren)", 105, cursorY, { align: "center" });
    cursorY += 6;
    doc.text("Pondok Pesantren Darunna'im Yapia", 105, cursorY, { align: "center" });
    
    cursorY += 6;
    doc.setFontSize(10);
    doc.setFont("times", "italic");
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Tanggal Cetak: ${tglCetak}`, 105, cursorY, { align: "center" });

    cursorY += 5;
    doc.setLineWidth(0.5);
    doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
    cursorY += 10;

    // 1. RINGKASAN KEUANGAN
    doc.setFont("times", "bold");
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
      styles: { font: 'times', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // Sisipkan Grafik Keuangan (Bar Chart)
    if (barChartRef && barChartRef.current) {
      const barCanvas = await html2canvas(barChartRef.current, { scale: 2, backgroundColor: "#FFFFFF" });
      
      // 2. OPTIMASI: Ubah ke JPEG dan turunkan kualitas ke 70% (0.7)
      const barImg = barCanvas.toDataURL("image/jpeg", 0.7);
      const imgProps = doc.getImageProperties(barImg);
      const pdfImgWidth = 120; 
      const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
      const centeredX = (210 - pdfImgWidth) / 2;

      checkPageBreak(pdfImgHeight + 10);
      
      // 3. OPTIMASI: Set format JPEG dan gunakan parameter kompresi 'FAST'
      doc.addImage(barImg, "JPEG", centeredX, cursorY, pdfImgWidth, pdfImgHeight, undefined, 'FAST');
      cursorY += pdfImgHeight + 12;
    }

    // 2. REKAPITULASI KESEHATAN SANTRI
    checkPageBreak(30);
    doc.setFont("times", "bold");
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
      styles: { font: 'times', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // Grafik Kesehatan (Pie Chart)
    if (pieChartRef && pieChartRef.current) {
      const pieCanvas = await html2canvas(pieChartRef.current, { scale: 2, backgroundColor: "#FFFFFF" });
      
      // 2. OPTIMASI: Ubah ke JPEG dan turunkan kualitas ke 70% (0.7)
      const pieImg = pieCanvas.toDataURL("image/jpeg", 0.7);
      const pieSize = 90; 
      const imgProps = doc.getImageProperties(pieImg);
      const pdfImgHeight = (imgProps.height * pieSize) / imgProps.width;
      const centeredX = (210 - pieSize) / 2;

      checkPageBreak(pdfImgHeight + 10);
      
      // 3. OPTIMASI: Set format JPEG dan gunakan parameter kompresi 'FAST'
      doc.addImage(pieImg, "JPEG", centeredX, cursorY, pieSize, pdfImgHeight, undefined, 'FAST');
      cursorY += pdfImgHeight + 12;
    }

    // 3. REKAPITULASI PENGADUAN
    checkPageBreak(40);
    doc.setFont("times", "bold");
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
      styles: { font: 'times', fontSize: 10 }
    });
    cursorY = doc.lastAutoTable.finalY + 12;

    // 4. INDEKS KEPUASAN SANTRI
    checkPageBreak(20);
    doc.setFont("times", "bold");
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
      styles: { font: 'times', fontSize: 10 }
    });

    // FOOTER HALAMAN
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("times", "italic");
      doc.setTextColor(100);
      doc.text("Dokumen ini dihasilkan secara otomatis oleh sistem SIM-Tren.", 105, 297 - 15, { align: "center" });
      doc.text(`Halaman ${i} dari ${pageCount}`, 210 - margin.right, 297 - 15, { align: "right" });
    }

    doc.save(`Laporan_Manajemen_Pimpinan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`);

  } catch (error) {
    console.error("Gagal generate PDF", error);
    throw error;
  }
};