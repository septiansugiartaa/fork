import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  History,
  AlertTriangle,
  CheckCircle,
  X, // Import Icon Alert
} from "lucide-react";

// Import Modals
import TagihanModal from "../../components/TagihanModal";
import BayarModal from "../../components/BayarModal";

export default function KeuanganSantri() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" }); // State Alert

  // State Modal
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBayarOpen, setIsBayarOpen] = useState(false);
  const [tagihanToPay, setTagihanToPay] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const API_URL = "http://localhost:3000/api/santri/keuangan";

  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // --- HELPER ALERT (TOAST) ---
  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  };

  useEffect(() => {
    fetchKeuangan();
  }, []);

  const fetchKeuangan = async () => {
    try {
      setLoading(true);
      const response = await api.get("/");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Gagal memuat data keuangan");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers Modal ---

  const handleOpenDetail = (tagihan) => {
    setSelectedTagihan(tagihan);
    setIsDetailOpen(true);
  };

  const handleOpenBayar = (tagihan) => {
    setTagihanToPay(tagihan);
    setIsBayarOpen(true);
  };

  const handleSubmitBayar = async (idTagihan, file) => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("id_tagihan", idTagihan);
    formData.append("bukti_bayar", file);

    try {
      const res = await api.post("/bayar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        showAlert("success", "Bukti pembayaran berhasil dikirim!");
        setIsBayarOpen(false);
        setIsDetailOpen(false);
        fetchKeuangan();
      }
    } catch (err) {
      console.error(err);
      showAlert(
        "error",
        err.response?.data?.message || "Gagal mengirim bukti pembayaran.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-10 w-full overflow-x-hidden">
      {/* --- FLOATING ALERT (Z-Index 11000: Paling Atas) --- */}
      {message.text && (
        <div
          className={`fixed top-4 left-4 right-4 md:top-8 md:right-8 md:left-auto md:w-96 z-[11000] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 ${message.type === "error" ? "bg-white border-red-500 text-red-700" : "bg-white border-green-500 text-green-700"}`}
        >
          <div
            className={`flex-shrink-0 p-2 rounded-full ${message.type === "error" ? "bg-red-100" : "bg-green-100"}`}
          >
            {message.type === "error" ? (
              <AlertTriangle size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
          </div>
          <p className="text-sm font-medium flex-1">{message.text}</p>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-24 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/santri")}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">Daftar Tagihan</h1>
            <p className="text-green-100 text-sm truncate">
              Informasi pembayaran dan riwayat transaksi
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-16 space-y-8 relative z-10">
        {/* Data Diri Santri */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Data Diri Santri
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-green-600/80 mb-1">
                Nama Santri
              </label>
              <p className="text-gray-900 font-semibold text-lg truncate">
                {data.info_santri.nama}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600/80 mb-1">
                NIS
              </label>
              <p className="text-gray-900 font-semibold text-lg">
                {data.info_santri.nis}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600/80 mb-1">
                Kelas
              </label>
              <p className="text-gray-900 font-semibold text-lg">
                {data.info_santri.kelas}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600/80 mb-1">
                Tagihan Aktif
              </label>
              <p className="text-red-600 font-bold text-lg flex items-center">
                {data.info_santri.jumlah_tagihan_aktif}
                <span className="text-xs font-normal text-gray-500 ml-2 bg-red-50 px-2 py-0.5 rounded-full">
                  Belum Lunas
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tagihan Aktif */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <CreditCard className="mr-2 text-green-600" size={24} /> Tagihan
            Aktif
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 pl-6">Nama Tagihan</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Batas Pembayaran</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.tagihan_aktif.length > 0 ? (
                    data.tagihan_aktif.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-green-50/50 transition"
                      >
                        <td className="p-4 pl-6 text-gray-800 font-medium">
                          {item.nama_tagihan}
                        </td>
                        <td className="p-4 text-gray-600">{item.nominal}</td>
                        <td className="p-4 text-red-500 text-sm font-medium">
                          {item.batas_pembayaran}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="mt-2 p-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        Tidak ada tagihan aktif.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="block md:hidden p-4 space-y-4">
              {data.tagihan_aktif.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800">
                      {item.nama_tagihan}
                    </h4>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      Aktif
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm space-y-1">
                    <p className="flex justify-between">
                      <span>Nominal:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {item.nominal}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Jatuh Tempo:</span>{" "}
                      <span className="text-red-500">
                        {item.batas_pembayaran}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Riwayat Lunas */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <History className="mr-2 text-green-600" size={24} /> Riwayat
            Tagihan Lunas
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 pl-6">Nama Tagihan</th>
                    <th className="p-4">Nominal</th>
                    <th className="p-4">Tanggal Pelunasan</th>
                    <th className="p-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.riwayat_lunas.length > 0 ? (
                    data.riwayat_lunas.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 pl-6 text-gray-800 font-medium">
                          {item.nama_tagihan}
                        </td>
                        <td className="p-4 text-gray-600">{item.nominal}</td>
                        <td className="p-4 text-green-600 text-sm font-medium">
                          {item.tanggal_lunas}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="mt-2 p-2 border border-green-200 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        Belum ada riwayat pembayaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="block md:hidden p-4 space-y-4">
              {data.riwayat_lunas.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 bg-gray-50/50"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-700">
                      {item.nama_tagihan}
                    </h4>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                      Lunas
                    </span>
                  </div>
                  <div className="text-gray-600 text-sm space-y-1">
                    <p className="flex justify-between">
                      <span>Nominal:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {item.nominal}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Lunas Pada:</span>{" "}
                      <span className="text-green-600">
                        {item.tanggal_lunas}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="w-full mt-2 py-2 border border-green-200 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition"
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RENDER MODALS */}
      <TagihanModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedTagihan}
        onPayClick={handleOpenBayar}
        userRole={"santri"}
      />

      <BayarModal
        isOpen={isBayarOpen}
        onClose={() => setIsBayarOpen(false)}
        tagihan={tagihanToPay}
        onSubmit={handleSubmitBayar}
        saving={isSaving}
        showAlert={showAlert}
      />
    </div>
  );
}
