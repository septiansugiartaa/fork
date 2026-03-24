import { useEffect, useState } from "react";
import { ChevronDown, CircleHelp, Loader2 } from "lucide-react";
import api from "../config/api";

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const res = await api.get("/global/faq");
        const rows = res.data?.data || [];
        setFaqs(rows);
        if (rows.length > 0) {
          setOpenId(rows[0].id_faq);
        }
      } catch (error) {
        console.error("Gagal memuat FAQ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">FAQ</h1>
        <p className="text-gray-500 text-sm">Pertanyaan yang sering ditanyakan seputar sistem dan modul kesehatan.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-6 space-y-3">
        {faqs.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada data FAQ.</div>
        ) : (
          faqs.map((item) => {
            const isOpen = openId === item.id_faq;
            return (
              <div key={item.id_faq} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : item.id_faq)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <span className="text-left text-sm sm:text-base font-semibold text-gray-800 flex items-start gap-2">
                    <CircleHelp className="text-green-600 mt-0.5" size={18} />
                    {item.pertanyaan}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 py-4 text-sm text-gray-700 leading-relaxed bg-white border-t border-gray-100 whitespace-pre-wrap">
                    {item.jawaban}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
