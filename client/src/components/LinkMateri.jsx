import { useNavigate } from "react-router-dom";

function LinkMateri({ materiList = [], detailBasePath }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold border-b border-gray-300 pb-2 mt-2">
        Materi Lain
      </h3>

      {materiList.map((materi) => (
        <div
          key={materi.id}
          onClick={() => navigate(`${detailBasePath}/${materi.id}`)}
          className="flex gap-3 cursor-pointer group"
        >
          <div className="w-15 h-15 flex-shrink-0 overflow-hidden hover:">
            {materi.gambar ? (
              <img
                // Menggunakan path relatif agar didukung oleh proxy Vite
                src={`/uploads/${materi.gambar}`}
                alt={materi.judul_materi}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-teal-500"></div>
            )}
          </div>

          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 text-base hover:text-green-600 hover:transition duration-200">
              {materi.judul}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {materi.penulis}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LinkMateri;