import jsPDF from "jspdf";
import logoPesantren from "../../assets/logo-border.png"; 

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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", { 
    day: "numeric", month: "long", year: "numeric" 
  }).format(new Date(dateString));
};

// ---------------------------------------------------------
// 1. FUNGSI CETAK UNDANGAN SELEKSI
// ---------------------------------------------------------
export const cetakUndanganSeleksi = async ({ noPendaftaran, namaLengkap, namaGelombang, tahunAjaran, tanggalSeleksi }) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const margin = { left: 20, right: 20 }; 
  let cursorY = 10;
  const printWidth = 210 - margin.left - margin.right;
  doc.setLineHeightFactor(1.5);

  // KOP SURAT 
  try {
    const logoBase64 = await getBase64ImageFromUrl(logoPesantren);
    doc.addImage(logoBase64, "PNG", margin.left, cursorY, 21, 21);
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
  doc.text("Email: ponpesmodern.darunnaimyapia@gmail.com | IG: @ponpes_modern_darun_naim_yapia", 105, cursorY + 18, { align: "center" });
  
  // Garis Bawah Kop Surat
  cursorY += 23; 
  doc.setLineWidth(0.8);
  doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
  cursorY += 1;
  doc.setLineWidth(0.2);
  doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
  
  // ISI SURAT
  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SURAT PANGGILAN SELEKSI", 105, cursorY, { align: "center" });
  
  cursorY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  const openingText = `Berdasarkan hasil verifikasi dokumen pendaftaran Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran ${tahunAjaran}, kami memberitahukan bahwa Calon Santri di bawah ini:`;
  doc.text(openingText, margin.left, cursorY, { align: "justify", maxWidth: printWidth - 1.5-1.5 });

  cursorY += 14;
  doc.setFont("helvetica", "bold");
  doc.text("Nama Lengkap", margin.left + 10, cursorY); doc.text(`: ${namaLengkap}`, margin.left + 50, cursorY);
  cursorY += 6;
  doc.text("No. Pendaftaran", margin.left + 10, cursorY); doc.text(`: ${noPendaftaran}`, margin.left + 50, cursorY);
  cursorY += 6;
  doc.text("Jalur", margin.left + 10, cursorY); doc.text(`: ${namaGelombang}`, margin.left + 50, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  const middleText = `Dinyatakan LOLOS VERIFIKASI BERKAS dan diwajibkan untuk hadir mengikuti Ujian Seleksi (Tes Baca Al-Quran & Wawancara) yang akan diselenggarakan pada:`;
  doc.text(middleText, margin.left, cursorY, { align: "justify", maxWidth: printWidth - 1.5-1.5 });

  cursorY += 14;
  doc.setFont("helvetica", "bold");
  const jadwalTes = tanggalSeleksi ? formatDate(tanggalSeleksi) : "Menunggu Jadwal dari Panitia"; 
  doc.text("Hari / Tanggal", margin.left + 10, cursorY); doc.text(`: ${jadwalTes}`, margin.left + 50, cursorY);
  cursorY += 6;
  doc.text("Waktu", margin.left + 10, cursorY); doc.text(`: 08.00 WIB s/d Selesai`, margin.left + 50, cursorY);
  cursorY += 6;
  doc.text("Tempat", margin.left + 10, cursorY); doc.text(`: Pondok Pesantren Darun-Na'im YAPIA`, margin.left + 50, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Catatan yang harus dibawa saat tes:", margin.left, cursorY);
  cursorY += 6;
  doc.text("1. Membawa cetak Bukti Pendaftaran.", margin.left + 5, cursorY);
  cursorY += 6;
  doc.text("2. Calon santri wajib didampingi oleh Orang Tua / Wali.", margin.left + 5, cursorY);
  cursorY += 6;
  doc.text("3. Berpakaian rapi, sopan, dan menutup aurat (Peci/Pakaian Muslim).", margin.left + 5, cursorY);

  cursorY += 25;
  doc.text("Bogor, " + formatDate(new Date()), 210 - margin.right, cursorY, { align: "right" });
  cursorY += 6;
  doc.text("PPDB Pondok Pesantren Darunna'im Yapia", 210 - margin.right, cursorY, { align: "right" });

  // FOOTER 
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
  }

  doc.save(`Undangan_Seleksi_${noPendaftaran}.pdf`);
  return true;
};

// 2. FUNGSI CETAK BUKTI KELULUSAN
export const cetakBuktiKelulusan = async ({ noPendaftaran, namaLengkap, tahunAjaran, nilaiQuran, nilaiTulis, nilaiWawancara, nilaiTotal }) => {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  const margin = { left: 20, right: 20 }; 
  const printWidth = 210 - margin.left - margin.right;
  let cursorY = 10;
  doc.setLineHeightFactor(1.5);

  // KOP SURAT 
  try {
    const logoBase64 = await getBase64ImageFromUrl(logoPesantren);
    doc.addImage(logoBase64, "PNG", margin.left, cursorY, 21, 21);
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
  doc.text("Email: ponpesmodern.darunnaimyapia@gmail.com | IG: @ponpes_modern_darun_naim_yapia", 105, cursorY + 18, { align: "center" });
  
  // Garis Bawah Kop Surat
  cursorY += 23; 
  doc.setLineWidth(0.8);
  doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
  cursorY += 1;
  doc.setLineWidth(0.2);
  doc.line(margin.left, cursorY, 210 - margin.right, cursorY);
  
  // ISI SURAT
  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SURAT KETERANGAN LULUS SELEKSI", 105, cursorY, { align: "center" });
  
  cursorY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Berdasarkan hasil akumulasi penilaian seleksi Penerimaan Peserta Didik Baru Tahun Ajaran ${tahunAjaran}, calon santri di bawah ini:`, margin.left, cursorY, { align: "justify", maxWidth: printWidth - 1.5 });

  cursorY += 14;
  doc.setFont("helvetica", "bold");
  doc.text("Nama Lengkap", margin.left + 10, cursorY); doc.text(`: ${namaLengkap}`, margin.left + 50, cursorY);
  cursorY += 6;
  doc.text("No. Pendaftaran", margin.left + 10, cursorY); doc.text(`: ${noPendaftaran}`, margin.left + 50, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Dengan rincian nilai tes sebagai berikut:", margin.left, cursorY);
  
  // KOTAK NILAI
  cursorY += 4;
  doc.setFillColor(249, 250, 251); 
  doc.setDrawColor(229, 231, 235); 
  doc.roundedRect(margin.left, cursorY, printWidth, 34, 3, 3, 'FD');
  
  doc.setFontSize(10);
  cursorY += 8;
  doc.text("1. Tes Bacaan & Hafalan Al-Quran", margin.left + 5, cursorY); doc.text(`: ${nilaiQuran || 0}`, margin.left + 80, cursorY);
  cursorY += 6;
  doc.text("2. Tes Tulis", margin.left + 5, cursorY); doc.text(`: ${nilaiTulis || 0}`, margin.left + 80, cursorY);
  cursorY += 6;
  doc.text("3. Wawancara", margin.left + 5, cursorY); doc.text(`: ${nilaiWawancara || 0}`, margin.left + 80, cursorY);
  
  cursorY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL NILAI AKHIR", margin.left + 5, cursorY); doc.text(`: ${nilaiTotal || 0}`, margin.left + 80, cursorY);

  cursorY += 16;
  doc.setFontSize(14);
  doc.setTextColor(21, 128, 61); 
  doc.text("DINYATAKAN LULUS DAN DITERIMA", 105, cursorY, { align: "center" });

  cursorY += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const catatan = "Kepada Calon Santri dan Orang Tua/Wali yang dinyatakan lulus, diwajibkan untuk segera melakukan Proses Daftar Ulang ke bagian Administrasi Pondok Pesantren sesuai dengan jadwal yang telah ditentukan.";
  doc.text(catatan, margin.left, cursorY, { align: "justify", maxWidth: printWidth - 1.5 });

  cursorY += 25;
  doc.text("Bogor, " + formatDate(new Date()), 210 - margin.right, cursorY, { align: "right" });
  cursorY += 6;
  doc.text("PPDB Pondok Pesantren Darunna'im Yapia", 210 - margin.right, cursorY, { align: "right" });

  // FOOTER 
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
  }

  doc.save(`Surat_Kelulusan_${noPendaftaran}.pdf`);
  return true;
};