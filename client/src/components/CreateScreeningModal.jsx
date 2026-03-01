import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateScreeningModal({ onClose }) {
  const [santri, setSantri] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSantri = async () => {
        try {
        setLoading(true);

        const token = localStorage.getItem("token");

        const res = await axios.get(
            "http://localhost:3000/api/timkesehatan/screening/santri/list",
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        setSantri(res.data);
        } catch (error) {
        console.error(error);
        } finally {
        setLoading(false);
        }
    };

    fetchSantri();
    }, []);

  const handleSelect = (id) => {
    navigate(`/screening/create/${id}`);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
        <h2 className="text-xl font-bold mb-4">Pilih Santri</h2>

        {santri.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className="p-2 border-b cursor-pointer hover:bg-gray-100"
          >
            {item.nama}
          </div>
        ))}

        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-3 py-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default CreateScreeningModal;