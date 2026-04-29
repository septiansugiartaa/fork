import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Microscope } from "lucide-react";
import DOMPurify from "dompurify";
import LinkMateri from "../../components/LinkMateri";
import api from "../../config/api";
import CommentSection from "../../components/CommentSection";

// PATCH: sanitasi HTML dari rich-text editor sebelum dirender (Stored XSS fix)
const sanitize = (html) => DOMPurify.sanitize(html || "", {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    "p","br","strong","em","u","s","h1","h2","h3","h4","h5","h6",
    "ul","ol","li","blockquote","pre","code","span","div","img",
    "a","table","thead","tbody","tr","th","td",
  ],
  ALLOWED_ATTR: ["href","src","alt","class","target","rel","style"],
  FORBID_ATTR: ["onerror","onload","onclick","onmouseover"],
});

function DetailMateri() {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [materiLain, setMateriLain] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role?.trim().toLowerCase();

  const detailBasePath = "/pimpinan/scabies/materi";

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/global/manageMateri/${id}`);
        if (res.data.success) setMateri(res.data.data);
      } catch (err) {
        console.error("Gagal memuat detail materi:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  useEffect(() => {
    const fetchMateriLain = async () => {
      try {
        const res = await api.get("/global/manageMateri");
        if (res.data.success) {
          const filtered = res.data.data.list_materi.filter((item) => item.id !== Number(id));
          setMateriLain(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error("Gagal memuat materi lain:", err);
      }
    };
    fetchMateriLain();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!materi) return <div className="p-10 text-center text-gray-500">Materi tidak ditemukan</div>;

  // PATCH: sanitasi sekali, pakai di semua tempat
  const safeHtml = sanitize(materi.detail_materi?.[0]?.isi_materi);

  if (role === "timkesehatan") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {materi.gambar ? (
            <img src={`/uploads/${materi.gambar}`} alt={materi.judul_materi} className="w-full h-72 object-cover" />
          ) : (
            <div className="w-full h-72 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
              <Microscope className="text-emerald-600" size={48} />
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3">
              <h1 className="text-2xl font-bold text-gray-800 text-[30px] mb-5">{materi.judul_materi}</h1>
              {/* PATCH: __html disanitasi */}
              <div
                className="prose prose-base sm:prose-lg max-w-none text-justify
                          [&_h3]:leading-snug [&_h4]:leading-snug [&_p]:leading-relaxed
                          [&_ul]:leading-relaxed [&_ol]:leading-relaxed
                          [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
              <div className="mt-6 pt-4 text-gray-500 text-sm">Penulis: {materi.penulis}</div>
            </div>
            <div className="w-full lg:w-1/3 lg:border-t-0 lg:border-l border-gray-300 border-t lg:pt-0 lg:pl-6 mt-5">
              <LinkMateri materiList={materiLain} detailBasePath={detailBasePath} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 mb-6 pt-6">
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {materi.gambar ? (
            <img src={`/uploads/${materi.gambar}`} alt={materi.judul_materi} className="w-full h-48 sm:h-64 md:h-72 object-cover" />
          ) : (
            <div className="w-full h-48 sm:h-64 md:h-72 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
              <Microscope className="text-emerald-600" size={52} />
            </div>
          )}
        </div>    
      </div>  
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-2/3">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">{materi.judul_materi}</h1>
              {/* PATCH: __html disanitasi */}
              <div
                className="prose prose-base sm:prose-lg max-w-none text-justify
                          [&_h3]:leading-snug [&_h4]:leading-snug [&_p]:leading-relaxed
                          [&_ul]:leading-relaxed [&_ol]:leading-relaxed
                          [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
              <div className="mt-6 pt-4 text-gray-600 text-sm">Penulis: {materi.penulis}</div>
            </div>
            <div className="w-full lg:w-1/3 lg:border-t-0 lg:border-l border-gray-300 border-t lg:pt-0 lg:pl-6 mt-5">
              <LinkMateri materiList={materiLain} detailBasePath={detailBasePath} />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <CommentSection materiId={id} />
      </div>
    </div>
  );
}

export default DetailMateri;
