import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../config/api";
import { Loader2, ArrowLeft } from "lucide-react";
import { exportScreeningPdf } from "../../../components/PdfScreening";

export default function ViewScreeningPage({ rolePrefix }) {
  const { screeningId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get(`/${rolePrefix}/screening/${screeningId}`);
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

  // Load Preview PDF
  useEffect(() => {
    if (data) {
      const loadPdfPreview = async () => {
        try {
          const url = await exportScreeningPdf(data, screeningId, 'preview');
          setPdfUrl(url);
        } catch (err) {
          console.error("Gagal generate preview PDF", err);
          setError("Gagal memuat dokumen PDF");
        }
      };
      loadPdfPreview();
    }
  }, [data, screeningId]);

  const handleDownload = async () => {
    if (!data) return;
    try {
      await exportScreeningPdf(data, screeningId, 'download');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || (!pdfUrl && data && !error)) {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mb-10 flex items-center ">
        <button
          onClick={() => navigate(`/${rolePrefix}/daftarSantriScreening/${santri?.id}`)}
          className="flex-shrink-0 hover:bg-white/20 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-3">
          Detail Laporan Screening Santri
        </h1>
        <div />
      </div>

      <div className="max-w-3xl mx-auto h-[120vh] md:h-[280vh] sm:px-4">
        {pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=Fit`}
            width="100%"
            height="100%"
            title="Preview PDF"
            className="border-none w-full h-full shadow-lg bg-white"
          />
        )}
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
