import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import LinkMateri from "../components/LinkMateri";
import CommentSection from "../components/CommentSection";
import api from "../config/api"

const LEGACY_RECENT_STORAGE_KEY = "santri_recent_materi";

function DetailMateri() {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [materiLain, setMateriLain] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.trim().toLowerCase();

  const rolePathMap = {
    timkesehatan: "/timkesehatan/manageMateri",
    santri: "/santri/scabies/viewMateri",
    admin: "/admin/manageMateri",
    // orangtua: "orangtua/viewMateri"
    // ustadz: "ustadz/viewMateri"
  };

  const detailBasePath = rolePathMap[role] || "/viewMateri";
  const backPath = location.state?.from || detailBasePath;
  const rootFrom = location.state?.rootFrom || backPath;

  const handleBack = () => {
    if (backPath.includes("/viewMateri")) {
      navigate(backPath, { state: { from: rootFrom, rootFrom } });
      return;
    }
    navigate(backPath, { state: { rootFrom } });
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/global/manageMateri/${id}`,);
        if (res.data.success) {
          setMateri(res.data.data);
        }
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();

  }, [id]);

  useEffect(() => {
    if (materi) {
      console.log("ISI:", materi.detail_materi?.[0]?.isi_materi);
    }
  }, [materi]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_RECENT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const trackMateriView = async () => {
      if (role !== "santri" || !materi?.id_materi) return;
      try {
        await api.post(`/santri/scabies/materi/${materi.id_materi}/view`);
      } catch (error) {
        console.error("Gagal menyimpan riwayat materi:", error);
      }
    };

    trackMateriView();
  }, [materi, role]);

  useEffect(() => {
    const fetchMateriLain = async () => {
      try {
        const res = await api.get("/global/manageMateri",);
        if (res.data.success) {
          const filtered = res.data.data.list_materi.filter(
            (item) => item.id !== Number(id)
          );

          setMateriLain(filtered.slice(0, 5));
        }

      } catch (err) {
        console.error(err);
      }
    };

    fetchMateriLain();
  }, [id]);

  if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">
                    Memuat data...
                    </p>
                </div>
            </div>
        );
    }
  if (!materi) return <p>Materi tidak ditemukan</p>;

  const tanggalMateri = materi?.tanggal_dibuat
    ? new Date(materi.tanggal_dibuat).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    : "-";

  if (role === "timkesehatan") {
    return (
      <div className="space-y-6">

      {/* Gambar */}
      {materi.gambar && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <img
            src={`http://localhost:3000/uploads/${materi.gambar}`}
            alt={materi.judul_materi}
            className="w-full h-72 object-cover"
          />
        </div>
      )}

      {/* Header + Content + Sidebar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* HEADER + KIRI - ISI MATERI */}
          <div className="w-full lg:w-2/3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 text-[30px] mb-5">
                {materi.judul_materi}
              </h1>
              <br />
            </div>
            <div
              className="prose prose-base sm:prose-lg max-w-none text-justify
                        [&_h3]:leading-snug
                        [&_h4]:leading-snug
                        [&_p]:leading-relaxed
                        [&_ul]:leading-relaxed
                        [&_ol]:leading-relaxed
                        [&_h1]:my-2
                        [&_h2]:my-2
                        [&_h3]:my-2"
              dangerouslySetInnerHTML={{
                __html: materi.detail_materi?.[0]?.isi_materi || ""
              }}
            />

            <div className="mt-6 pt-4 text-gray-500 text-sm">
              Penulis: {materi.penulis}
            </div>
            <div className="mt-2 text-gray-500 text-sm">
              Tanggal: {tanggalMateri}
            </div>
          </div>

          {/* KANAN - MATERI LAIN */}
          <div className="w-full lg:w-1/3
            lg:border-t-0 lg:border-l border-gray-300
            border-t lg:pt-0 lg:pl-6 mt-5">

            <LinkMateri
              materiList={materiLain}
              detailBasePath={detailBasePath}
              fromPath={location.pathname}
              rootFrom={rootFrom}
            />
          </div>

        </div>
      </div> 
      <CommentSection materiId={id} />
    </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

    {/* HEADER */}
    <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white px-4 sm:px-6 py-6 pb-20 sm:pb-24 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <button
          onClick={handleBack}
          className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">
            Jendela Ilmu Pengetahuan Tentang Scabies
          </h1>
        </div>
      </div>
    </div>

    {/* GAMBAR */}
    {materi.gambar && (
      <div className="max-w-6xl mx-auto px-4 -mt-14 sm:-mt-16 mb-6">
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <img
            src={`http://localhost:3000/uploads/${materi.gambar}`}
            alt={materi.judul_materi}
            className="w-full h-48 sm:h-64 md:h-72 object-cover"
          />
        </div>
      </div>
    )}

    {/* CONTENT */}
    <div className="max-w-6xl mx-auto px-4 mb-12">
      <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* KIRI - ISI MATERI */}
          <div className="w-full lg:w-2/3">
            <div
              className="prose prose-base sm:prose-lg max-w-none text-justify
                        [&_h3]:leading-snug
                        [&_h4]:leading-snug
                        [&_p]:leading-relaxed
                        [&_ul]:leading-relaxed
                        [&_ol]:leading-relaxed
                        [&_h1]:my-2
                        [&_h2]:my-2
                        [&_h3]:my-2"
              dangerouslySetInnerHTML={{
                __html: materi.detail_materi?.[0]?.isi_materi || ""
              }}
            />

            <div className="mt-6 pt-4 text-gray-600 text-sm">
              Penulis: {materi.penulis}
            </div>
            <div className="mt-2 text-gray-600 text-sm">
              Tanggal: {tanggalMateri}
            </div>
          </div>

          {/* KANAN - MATERI LAINNYA */}
          <div className="
            w-full lg:w-1/3
            lg:border-t-0 lg:border-l border-gray-300
            border-t lg:pt-0 lg:pl-6 mt-5"
          >
            <LinkMateri
              materiList={materiLain}
              detailBasePath={detailBasePath}
              fromPath={location.pathname}
              rootFrom={rootFrom}
            />
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