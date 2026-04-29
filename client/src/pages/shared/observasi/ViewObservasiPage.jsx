import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import api from "../../../config/api";
import { exportObservasiPdf } from "../../../components/PdfObservasi";

export default function ViewObservasiPage({ rolePrefix, backPath, shellVariant = "default" }) {
  const { observasiId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/${rolePrefix}/observasi/${observasiId}`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data observasi");
    } finally {
      setLoading(false);
    }
  }, [observasiId, rolePrefix]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!data) return;

    const loadPreview = async () => {
      try {
        const url = await exportObservasiPdf(data, observasiId, "preview");
        setPdfUrl(url);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat dokumen PDF");
      }
    };

    loadPreview();
  }, [data, observasiId]);

  const handleDownload = async () => {
    if (!data) return;
    await exportObservasiPdf(data, observasiId, "download");
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
          <button onClick={fetchData} className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const santri = data.users_observasi_id_santriTousers;

  const isScabiesShell = shellVariant === "scabies";
  const targetBackPath = backPath || `/${rolePrefix}/daftarSantriObservasi/${santri?.id}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {isScabiesShell ? (
        <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20 mb-10">
          <div className="max-w-6xl mx-auto flex items-center">
            <button onClick={() => navigate(targetBackPath)} className="flex-shrink-0 rounded-full p-2 hover:bg-white/10 transition">
              <ArrowLeft size={24} />
            </button>
            <div className="ml-4">
              <p className="text-green-100 text-sm font-semibold">Dashboard Scabies Orang Tua</p>
              <h1 className="text-xl sm:text-2xl font-bold">Detail Laporan Observasi Anak</h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 flex items-center ">
          <button onClick={() => navigate(targetBackPath)} className="flex-shrink-0 hover:bg-white/20 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 ml-3">Detail Laporan Observasi Santri</h1>
        </div>
      )}

      <div className="max-w-3xl mx-auto h-[120vh] md:h-[280vh] sm:px-4">
        {pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=0&view=Fit`}
            width="100%"
            height="100%"
            title="Preview PDF Observasi"
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
