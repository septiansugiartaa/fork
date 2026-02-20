import { X, Plus, FileText } from "lucide-react";

export default function TagihanModal({ isOpen, onClose, data, onPayClick, userRole }) {
  if (!isOpen || !data) return null;

  const isLunas = data.status === "Lunas";

  const detailInfo = [
    { label: "Nama Tagihan", value: data.nama_tagihan },
    { label: "Jenis Tagihan", value: "SPP" },
    { label: "Nominal", value: data.nominal },
    { label: "Batas Pembayaran", value: data.batas_pembayaran },
    {
      label: "Status Tagihan",
      value: isLunas ? "Lunas" : "Belum Lunas",
      isStatus: true,
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Lunas":case "Diterima":case "Terverifikasi":case "Berhasil":
        return "bg-green-100 text-green-700 border border-green-200";
      case "Ditolak":case "Gagal":
        return "bg-red-100 text-red-700 border border-red-200";
      case "Menunggu Verifikasi":case "Sedang Diproses":case "Pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-gray-900 text-xl">Rincian Tagihan</h3>
            <p className="text-gray-500 text-sm mt-1">
              Informasi detail dan riwayat pembayaran
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-gray-50 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Informasi Rincian Tagihan
            </h4>
            <div className="space-y-0 border-t border-gray-100">
              {detailInfo.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row py-3 border-b border-gray-100"
                >
                  <div className="w-full md:w-1/3 text-sm text-blue-600/80 font-medium mb-1 md:mb-0">
                    {item.label}
                  </div>
                  <div
                    className={`w-full md:w-2/3 text-sm font-medium ${item.isStatus ? (isLunas ? "text-green-600" : "text-gray-800") : "text-gray-800"}`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800">
                Riwayat Pembayaran
              </h4>
              {!isLunas && userRole==="orangtua" && (
                <button
                  onClick={() => onPayClick(data)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition flex items-center shadow-sm"
                >
                  <Plus size={16} className="mr-2" /> Tambah Data Pembayaran
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                    <th className="p-4">Tanggal Pembayaran</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Bukti Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {data.riwayat_pembayaran &&
                  data.riwayat_pembayaran.length > 0 ? (
                    data.riwayat_pembayaran.map((bayar, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-sm text-gray-600">
                          {bayar.tanggal}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${getStatusBadge(bayar.status)}`}
                          >
                            {bayar.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() =>
                              window.open(
                                `http://localhost:3000/uploads/payments/${bayar.bukti}`,
                                "_blank",
                              )
                            }
                            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition inline-flex items-center"
                          >
                            <FileText size={14} className="mr-2" /> Lihat Bukti
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-8 text-center text-blue-400/60 bg-blue-50/30"
                      >
                        <p className="text-sm">Belum Ada Riwayat Pembayaran</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
