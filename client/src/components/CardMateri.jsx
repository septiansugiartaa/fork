import { useNavigate } from "react-router-dom";

function CardMateri({ materi }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-4xl shadow-md overflow-hidden
                 hover:shadow-2xl hover:-translate-y-1
                 transition-all duration-300
                 flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative">
        <img
          src={`http://localhost:3000/uploads/${materi.gambar}`}
          alt={materi.judul}
          className="w-full h-52 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <h2 className="absolute bottom-3 left-4 text-white font-semibold text-lg pl-2 pr-2">
          {materi.judul}
        </h2>
      </div>

      {/* CONTENT */}
      <div className="bg-white rounded-2xl p-5 flex flex-col flex-1">
        <div>
          <p className="text-gray-900 text-sm line-clamp-2">
            {materi.ringkasan}
          </p>

          <p className="text-xs text-gray-400 mt-2 mb-2">
            Penulis: {materi.penulis}
          </p>
        </div>

        {/* BUTTON STAY BOTTOM */}
        <button
          onClick={() =>
            navigate(`/santri/scabies/viewMateri/${materi.id}`)
          }
          className="mt-auto bg-blue-500 text-white py-2 rounded-xl
                     hover:bg-blue-800 transition duration-200
                     font-medium tracking-wide w-full cursor-pointer"
        >
          Baca Selengkapnya
        </button>
      </div>
    </div>
  );
}

export default CardMateri;
