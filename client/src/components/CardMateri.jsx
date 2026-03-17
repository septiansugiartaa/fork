import { useNavigate } from "react-router-dom";
import { Edit2, Trash2 } from "lucide-react";

function CardMateri({ materi, isManage, onDelete, onEdit, detailBasePath }) {
  const navigate = useNavigate();
  const tanggalMateri = materi?.tanggal_dibuat
    ? new Date(materi.tanggal_dibuat).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "-";

  return (
    <div className="bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className="relative w-full h-52">
        {materi.gambar ? (
          <img src={`/uploads/${materi.gambar}`} alt={materi.judul} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-teal-500"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <h2 className="absolute bottom-3 left-4 text-white font-semibold text-lg px-2">{materi.judul}</h2>
      </div>
      <div className="bg-white rounded-2xl p-5 flex flex-col flex-1">
        <div className="mb-5">
          <p className="text-gray-900 text-sm line-clamp-2">{materi.ringkasan}</p>
          <p className="text-xs text-gray-400 mt-2 mb-2">Penulis: {materi.penulis}</p>
          <p className="text-xs text-gray-400">Tanggal: {tanggalMateri}</p>
        </div>
        <div className="mt-auto">
          <button onClick={() => navigate(`${detailBasePath}/${materi.id}`)} className="w-full py-2.5 bg-green-50 text-green-600 rounded-xl font-semibold text-sm transition hover:bg-green-800 hover:text-white">Baca Selengkapnya</button>
          {isManage && (
            <div className="flex justify-between mt-1 mb-2 gap-1">
              <button className="w-1/2 py-2.5 bg-yellow-50 text-yellow-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 transition hover:bg-yellow-500 hover:text-white" onClick={() => onEdit(materi)}><Edit2 size={16}/> Edit</button>
              <button className="w-1/2 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm flex justify-center items-center gap-2 transition hover:bg-red-500 hover:text-white" onClick={() => onDelete(materi.id)}><Trash2 size={16}/> Hapus</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardMateri;