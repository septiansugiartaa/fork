import jsPDF from "jspdf";
import logoPesantren from "../../assets/logo-border.png"; 

// Helper: Convert Image URL/Path ke Base64
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

// Helper: Format Tanggal
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", { 
    day: "2-digit", month: "long", year: "numeric" 
  }).format(new Date(dateString));
};

// Fungsi Utama Cetak PDF
export const cetakBuktiPendaftaran = async ({ noPendaftaran, namaLengkap, namaGelombang, tahunAjaran }) => {
  try {
    // 1. SETTING KERTAS A4 SAMA SEPERTI LAPORAN PIMPINAN
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true 
    });

    // MARGIN SAMA PERSIS
    const margin = { left: 20, right: 20, bottom: 20 }; 
    const firstPageMarginTop = 10; 
    const printWidth = 210 - margin.left - margin.right;
    let cursorY = firstPageMarginTop;
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

    // JUDUL DOKUMEN
    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("BUKTI PENDAFTARAN PESERTA DIDIK BARU", 105, cursorY, { align: "center" });

    cursorY += 12; 

    // ISI DOKUMEN 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Telah diterima formulir pendaftaran secara online atas nama:", margin.left, cursorY);
    
    cursorY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Nama Lengkap", margin.left + 10, cursorY);
    doc.text(`:  ${namaLengkap}`, margin.left + 50, cursorY); 
    
    cursorY += 7;
    doc.setFont("helvetica", "normal");
    doc.text("Gelombang", margin.left + 10, cursorY);
    doc.text(`:  ${namaGelombang}`, margin.left + 50, cursorY);
    
    cursorY += 7;
    doc.text("Tahun Ajaran", margin.left + 10, cursorY);
    doc.text(`:  ${tahunAjaran}`, margin.left + 50, cursorY);

    // KOTAK NOMOR PENDAFTARAN
    cursorY += 10;
    doc.setDrawColor(22, 163, 74); // Hijau border
    doc.setFillColor(240, 253, 244); // Hijau sangat muda (bg-green-50)
    // Kotak memanjang mengikuti printWidth (A4)
    doc.roundedRect(margin.left, cursorY, printWidth, 26, 3, 3, "FD"); 
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61); // Hijau gelap
    doc.text("NOMOR PENDAFTARAN", 105, cursorY + 9, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Hitam
    doc.text(noPendaftaran, 105, cursorY + 18, { align: "center" });

    // CATATAN PENTING
    cursorY += 38;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Catatan Penting:", margin.left, cursorY);
    
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Teks catatan dipotong berdasarkan lebar printWidth A4
    const catatan1 = "1. Harap simpan dokumen ini dengan baik sebagai bukti pendaftaran yang sah.";
    const catatan2 = "2. Gunakan Nomor Pendaftaran di atas untuk mengecek status verifikasi dokumen dan kelulusan \n    seleksi secara berkala melalui portal PPDB SIM-Tren.";
    const catatan3 = "3. Keputusan Panitia Seleksi bersifat mutlak dan tidak dapat diganggu gugat.";
    
    doc.text(doc.splitTextToSize(catatan1, printWidth), margin.left, cursorY);
    cursorY += 6;
    doc.text(doc.splitTextToSize(catatan2, printWidth), margin.left, cursorY);
    cursorY += 12; 
    doc.text(doc.splitTextToSize(catatan3, printWidth), margin.left, cursorY);

    // FOOTER 
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 105, 297 - 21, { align: "center" });
      doc.text("Dokumen ini dihasilkan secara otomatis oleh SIM-Tren.", 105, 297 - 15, { align: "center" });
    }

    // Save PDF
    doc.save(`Bukti_Daftar_PPDB_${noPendaftaran}.pdf`);
    return true;

  } catch (error) {
    console.error("Gagal mencetak PDF:", error);
    throw error;
  }
};