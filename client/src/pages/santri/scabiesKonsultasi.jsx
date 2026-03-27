import { ArrowLeft, MessageCircleHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SantriScabiesKonsultasi() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/santri/scabies")}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Konsultasi Timkes</h1>
            <p className="text-green-100 text-sm">Halaman konsultasi sedang disiapkan.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MessageCircleHeart size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mt-4">Fitur Segera Hadir</h2>
          <p className="text-gray-500 mt-2">Konten halaman konsultasi belum dibuat. Silakan kembali ke dashboard scabies.</p>
          <button
            onClick={() => navigate("/santri/scabies")}
            className="mt-5 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Kembali ke Dashboard Scabies
          </button>
        </div>
      </div>
    </div>
  );
}
