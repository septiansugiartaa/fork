import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Sesuaikan path logo dengan struktur folder Anda
import logoPesantren from "../assets/logo.png"; 

const AREA_LABEL = {
  kepala: "Kepala", leher: "Leher", dada: "Dada", perut: "Perut",
  tangan_kiri: "Tangan Kiri", tangan_kanan: "Tangan Kanan", selangkangan: "Selangkangan",
  paha_kiri: "Paha Kiri", paha_kanan: "Paha Kanan", betis_kiri: "Betis Kiri", betis_kanan: "Betis Kanan"
};

const BENTUK_LABEL = {
  Ruam_Merah: "Ruam merah", Bintil_Merah_Kecil: "Bintil merah kecil",
  Terowongan_Kecil_di_Kulit: "Terowongan kecil di kulit", Bintil_Bernanah: "Bintil bernanah"
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

// Fungsi Menggambar Anatomi + List Teks Persis Seperti di UI Web
const drawAnatomySection = (doc, startX, startY, predileksi, rightMarginLimit) => {
  const activeAreas = new Set((predileksi || []).map((item) => item.area));
  
  // 1. Gambar Kotak Container Abu-abu untuk Anatomi
  const boxW = 46; 
  const boxH = 105;
  doc.setDrawColor(229, 231, 235); // border-gray-200
  doc.setFillColor(249, 250, 251); // bg-gray-50
  doc.setLineWidth(0.3);
  doc.roundedRect(startX, startY, boxW, boxH, 3, 3, 'FD');

  // 2. Gambar SVG Anatomi Manusia
  const scale = 0.25;
  const svgOffsetX = startX + ((boxW - (160 * scale)) / 2); // Center horizontal
  const svgOffsetY = startY + 5; 

  const setFill = (key) => {
    if (activeAreas.has(key)) doc.setFillColor(239, 68, 68); // Merah (#ef4444)
    else doc.setFillColor(229, 231, 235); // Abu-abu (#e5e7eb)
  };

  const drawCircle = (key, cx, cy, r) => {
    setFill(key);
    doc.circle(svgOffsetX + cx * scale, svgOffsetY + cy * scale, r * scale, 'F');
  };

  const drawRect = (key, x, y, w, h, rx) => {
    setFill(key);
    doc.roundedRect(svgOffsetX + x * scale, svgOffsetY + y * scale, w * scale, h * scale, rx * scale, rx * scale, 'F');
  };

  drawCircle("kepala", 80, 30, 18);
  drawRect("leher", 72, 48, 16, 14, 6);
  drawRect("dada", 50, 62, 60, 44, 20);
  drawRect("perut", 58, 104, 44, 46, 18);
  drawRect("tangan_kiri", 30, 70, 18, 95, 10);
  drawRect("tangan_kanan", 112, 70, 18, 95, 10);
  drawRect("selangkangan", 66, 150, 28, 30, 12);
  drawRect("paha_kiri", 52, 178, 22, 80, 12);
  drawRect("paha_kanan", 86, 178, 22, 80, 12);
  drawRect("betis_kiri", 56, 258, 16, 92, 10);
  drawRect("betis_kanan", 88, 258, 16, 92, 10);

  // 3. Gambar Teks List di Sebelah Kanan
  const listX = startX + boxW + 8; // Margin kiri untuk teks (jarak 8mm dari kotak)
  
  if (!predileksi || predileksi.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.text("Tidak ada area yang dipilih", listX, startY + (boxH / 2));
  } else {
    // Hitung jarak dinamis agar rapi (maksimal boxH, dibagi jumlah item)
    const rowHeight = Math.min(9.5, boxH / predileksi.length); 
    let listY = startY + 6;

    predileksi.forEach((item) => {
      const areaText = AREA_LABEL[item.area] || item.area;
      const descText = ` — Bentuk kelainan kulit: ${BENTUK_LABEL[item.bentuk_kelainan] || "-"}`;
      
      // a. Teks Area (Warna Hijau & Bold)
      doc.setFont("helvetica", "bold");
      doc.setTextColor(21, 128, 61); // green-700
      doc.setFontSize(9.5);
      doc.text(areaText, listX, listY);
      
      // Hitung lebar teks Area agar teks Deskripsi bisa menyambung
      const areaWidth = doc.getTextWidth(areaText);
      
      // b. Teks Deskripsi (Warna Abu-abu & Normal)
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99); // gray-600
      doc.text(descText, listX + areaWidth, listY);
      
      // c. Garis Bawah Tipis (Border Bottom)
      const borderY = listY + 3;
      doc.setDrawColor(243, 244, 246); // gray-100 (Sangat tipis)
      doc.setLineWidth(0.3);
      doc.line(listX, borderY, rightMarginLimit, borderY);
      
      listY += rowHeight; // Turun ke baris berikutnya
    });
  }

  // Mengembalikan total tinggi area ini agar cursorY PDF tahu kapan harus lanjut
  return boxH + 8; 
};

export const exportScreeningPdf = async (data, screeningId, action='download') => {
  if (!data) return;

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

    // Ekstrak Data
    const santri = data.users_screening_id_santriTousers;
    const timkesehatan = data.users_screening_id_timkesTousers;
    const kelas = santri?.kelas_santri?.[0]?.kelas?.kelas || "-";
    const kamar = santri?.kamar_santri?.[0]?.kamar?.kamar || "-";
    const bagianA = data.detail_screening.filter((d) => d.pertanyaan_screening.bagian === "A");
    const bagianB = data.detail_screening.filter((d) => d.pertanyaan_screening.bagian === "B");

    let predileksi = [];
    if (Array.isArray(data.screening_predileksi) && data.screening_predileksi.length > 0) {
      predileksi = data.screening_predileksi;
    } else {
      try {
        const parsed = data.catatan ? JSON.parse(data.catatan) : null;
        predileksi = (parsed?.area_predileksi || []).map((area) => ({ area, bentuk_kelainan: "Ruam_Merah" }));
      } catch { predileksi = []; }
    }

    // === KOP SURAT ===
    try {
      const logoBase64 = await getBase64ImageFromUrl(logoPesantren);
      doc.addImage(logoBase64, "PNG", margin.left, cursorY, 21, 21, undefined, 'FAST');
    } catch (error) {
      console.warn("Gagal memuat logo kop surat:", error);
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
    doc.setDrawColor(0, 0, 0); // Reset border color ke hitam untuk kop
    doc.line(margin.left, cursorY, printWidth, cursorY);
    cursorY += 1;
    doc.setLineWidth(0.2);
    doc.line(margin.left, cursorY, printWidth, cursorY);
    
    // === JUDUL ===
    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN HASIL SCREENING KESEHATAN", 105, cursorY, { align: "center" });
    
    cursorY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Tanggal Cetak: ${tglCetak}`, 105, cursorY, { align: "center" });
    doc.setTextColor(0);

    cursorY += 10;

    // Helper Judul Section
    const renderSubTitle = (title) => {
      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 166, 62); 
      doc.text(title, margin.left, cursorY);
      doc.setTextColor(0);
      cursorY += 4;
    };

    // 1. DATA SANTRI
    renderSubTitle("DATA SANTRI");
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin.left },
      body: [
        ['Nama Lengkap', ':', santri?.nama || "-"],
        ['NIS', ':', santri?.nip || "-"],
        ['Kamar / Kelas', ':', `${kamar} / ${kelas}`],
        ['Tanggal Pemeriksaan', ':', data.tanggal ? new Date(data.tanggal).toLocaleDateString("id-ID") : "-"],
      ],
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold', cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 1.5 } }, 1: { cellWidth: 5 }, 2: { cellWidth: 100 } },
    });
    cursorY = doc.lastAutoTable.finalY + 8;

    // Helper Tabel Pertanyaan dengan Garis Bawah
    const renderQuestionTable = (title, items) => {
      renderSubTitle(title);
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin.left, right: margin.right },
        body: items.map((item, i) => {
          const isNum = item.pertanyaan_screening.tipe_jawaban === "NUMBER";
          const ans = isNum ? `${item.nilai_number ?? "-"} hari` : (item.jawaban ? "Ya" : "Tidak");
          return [`${i + 1}.`, item.pertanyaan_screening.pertanyaan, ans];
        }),
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 1, right: 1 } },
        columnStyles: { 
          0: { cellWidth: 8, fontStyle: 'bold', textColor: [0, 166, 62] }, 
          1: { cellWidth: 125, textColor: [55, 65, 81] }, 
          2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } 
        },
        willDrawCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const val = data.cell.raw;
            if (val.includes("hari")) doc.setTextColor(21, 93, 252); 
            else if (val === "Ya") doc.setTextColor(0, 166, 62); 
            else doc.setTextColor(220, 38, 38); 
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            doc.setDrawColor(243, 244, 246); // border tipis abu-abu di tabel
            doc.setLineWidth(0.2);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    };

    // 2. BAGIAN A & B
    renderQuestionTable("A. RIWAYAT 14 - 30 HARI TERAKHIR", bagianA);
    renderQuestionTable("B. GEJALA YANG DIALAMI", bagianB);

    doc.addPage();
    cursorY = 20;

    // 3. PREDILEKSI (Menggunakan fungsi custom drawAnatomySection)
    renderSubTitle("C. AREA PREDILEKSI DAN BENTUK KELAINAN KULIT");
    checkPageBreak(115);
    
    const areaHeight = drawAnatomySection(doc, margin.left, cursorY, predileksi, printWidth);
    cursorY += areaHeight; 

    // 4. DIAGNOSA
    renderSubTitle("D. DIAGNOSA");
    const diagText = (data.diagnosa || "-").replaceAll("_", " ");
    cursorY += 4;
    if (data.diagnosa === "Scabies") doc.setTextColor(185, 28, 28);
    else if (data.diagnosa === "Bukan_Scabies") doc.setTextColor(21, 128, 61);
    else doc.setTextColor(161, 98, 7); 
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(diagText, margin.left + 5, cursorY);
    doc.setTextColor(0); 
    cursorY += 10;

    // 5. PENANGANAN
    renderSubTitle("E. PENANGANAN");
    const penangananData = (data.screening_penanganan || []).map((item, i) => [`${i + 1}.`, item.penanganan.opsi_penanganan]);
    if (penangananData.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin.left },
        body: penangananData,
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 1.5, textColor: [55, 65, 81] },
        columnStyles: { 0: { cellWidth: 9, cellPadding: { top: 1.5, bottom: 1.5, left: 5, right: 1.5 } }, 1: { cellWidth: 160 } },
      });
      cursorY = doc.lastAutoTable.finalY + 12;
    } else {
      doc.setFontSize(9.5);
      doc.setTextColor(156, 163, 175);
      doc.text("-", margin.left, cursorY);
      cursorY += 12;
    }

    // === FOOTER / TTD PEMERIKSA ===
    checkPageBreak(30);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9.5);
    doc.text("Nama Pemeriksa", margin.left, cursorY);
    doc.text(`: ${timkesehatan?.nama || "-"}`, margin.left + 35, cursorY);
    cursorY += 5;
    doc.text("Jabatan", margin.left, cursorY);
    doc.text(`: Tim Kesehatan`, margin.left + 35, cursorY);

    // === PAGE NUMBERS ===
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150);
      doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
      doc.text(`Halaman ${i} dari ${pageCount}`, printWidth, 297 - 15, { align: "right" });
    }

    if (action === 'preview') {
      return doc.output('bloburl'); 
    } else {
      doc.save(`Laporan_Screening_${santri?.nama?.replace(/\s+/g, "_") || screeningId}_${new Date(data.tanggal).toLocaleDateString("id-ID")}.pdf`);
    }

  } catch (error) {
    console.error("Gagal generate PDF", error);
    alert("Gagal mengunduh dokumen PDF.");
  }
};