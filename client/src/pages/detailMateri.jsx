import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import LinkMateri from "../components/LinkMateri";

function DetailMateri() {
  const { id } = useParams();
  const [materi, setMateri] = useState(null);
  const [materiLain, setMateriLain] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()
  
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.trim().toLowerCase();

  const rolePathMap = {
    timkes: "/timkesehatan/manageMateri",
    santri: "/santri/scabies/viewMateri",
    admin: "/admin/manageMateri",
    // orangtua: "orangtua/viewMateri"
    // ustadz: "ustadz/viewMateri"
    // pimpinan: "pimpinan/viewMateri"
  };

  const detailBasePath = rolePathMap[role] || "/viewMateri";

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `http://localhost:3000/api/global/manageMateri/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await res.json();
        
        if (result.success) {
          setMateri(result.data);
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
    const fetchMateriLain = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:3000/api/global/manageMateri",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const result = await res.json();

        if (result.success) {
          const filtered = result.data.list_materi.filter(
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(detailBasePath )}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Jendela Ilmu Pengetahuan Tentang Scabies</h1>
              
          </div>
        </div>
      </div>

      {/* GAMBAR */}
      <div className="w-285 h-35 bg-gray-800 -mt-17 mx-auto mb-6 rounded-3xl overflow-hidden shadow-xl">
        {materi.gambar && (
          <img
            src={`http://localhost:3000/uploads/${materi.gambar}`}
            alt={materi.judul_materi}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {/* CONTENT */}
      <div className="flex w-295 p-6 mx-auto mb-10 gap-3 shadow-xl rounded-2xl">
        <div className="w-4/6 p-4">
          <div className="prose prose-lg max-w-none text-justify
            [&_h1]:my-0 
            [&_h2]:my-0 
            [&_h3]:my-0 
            [&_p]:leading-7
            [&_h1]:leading-13
            [&_h2]:leading-10
            [&_ul]:leading-4"
            dangerouslySetInnerHTML={{
              __html: materi.detail_materi?.[0]?.isi_materi || ""
            }}
          /> <br />
          <p className="text-gray-600">
            Penulis : {materi.penulis}
          </p>
        </div>
        <div className="w-2/6 border-l border-gray-300 rounded-x p-4">
            <LinkMateri 
              materiList={materiLain}
              detailBasePath={detailBasePath}
            />
        </div>
      </div>
    </div>
  );
}

export default DetailMateri;