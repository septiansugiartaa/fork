import React, { useState, useEffect, useRef } from "react";
import api from "../config/api"; // MENGGUNAKAN API GLOBAL
import {
  X,
  Send,
  User,
  Loader2,
  Lock,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const formatTime = (dateString) => {
  if (!dateString) return "";
  return (
    new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " WIB"
  );
};

export default function DetailPengaduanModal({
  idAduan,
  onClose,
  onRefreshList,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tanggapan, setTanggapan] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const { message, showAlert, clearAlert } = useAlert();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  const [revealedChats, setRevealedChats] = useState({});
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Deteksi User Data
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;
  const currentRole = (currentUser.role || "").toLowerCase().replace(/\s/g, "");

  const canReply = ["admin", "pengurus", "ustadz", "orangtua"].includes(currentRole);
  const isAdminOrPengurus = ["admin", "pengurus"].includes(currentRole);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [tanggapan]);

  // AMBIL DETAIL DATA
  const fetchDetail = async () => {
    try {
      const { data } = await api.get(`/${currentRole}/pengaduan/${idAduan}`);
      setDetail(data.data);
    } catch (err) {
      showAlert("error", "Gagal memuat detail pengaduan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idAduan) fetchDetail();
  }, [idAduan]);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [detail]);

  // KIRIM TANGGAPAN
  const handleKirim = async () => {
    if (!tanggapan.trim() || !canReply) return;
    setSending(true);
    try {
      await api.post(`/${currentRole}/pengaduan/tanggapan`, {
        id_aduan: idAduan,
        isi_tanggapan: tanggapan,
      });

      setTanggapan("");
      fetchDetail();
    } catch (err) {
      showAlert("error", err.response?.data?.message || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  // SELESAIKAN PENGADUAN
  const handleSelesaikan = async () => {
    if (!window.confirm("Yakin ingin menyelesaikan laporan ini? Diskusi akan ditutup permanen.")) return;
    setFinishing(true);
    try {
      const { data } = await api.put(`/${currentRole}/pengaduan/${idAduan}/selesai`);

      if (data.success) {
        showAlert("success", data.message);
        fetchDetail();
        if (onRefreshList) onRefreshList();
      }
    } catch (err) {
      showAlert("error", "Gagal menyelesaikan pengaduan");
    } finally {
      setFinishing(false);
    }
  };

  const handleDelete = (item) => setDeleteModal({ isOpen: true, id: item.id, name: `chat ${item.users.nama}` });

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/${currentRole}/pengaduan/tanggapan/${deleteModal.id}`);
      showAlert("success", "Chat dihapus");
      setDeleteModal({ isOpen: false, id: null, name: "" });
      fetchDetail();
    } catch {
      showAlert("error", "Gagal menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRevealChat = (chatId) => {
    setRevealedChats((prev) => ({
      ...prev,
      [chatId]: !prev[chatId],
    }));
  };

  if (!idAduan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <AlertToast message={message} onClose={clearAlert} />

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* HEADER MODAL */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Rincian Laporan</h3>
            <p className="text-xs text-gray-500">Diskusi penyelesaian masalah</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdminOrPengurus && detail?.status === "Aktif" && (
              <button
                onClick={handleSelesaikan}
                disabled={finishing}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center disabled:opacity-50"
              >
                {finishing ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle size={14} className="mr-1" />}
                Tandai Selesai
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-green-600" />
            </div>
          ) : detail ? (
            <>
              {/* Info Pengaduan Utama */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${detail.status === "Selesai" ? "bg-green-500" : "bg-orange-500"}`}></div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {detail.users_pengaduan_id_pelaporTousers?.foto_profil ? (
                        <img
                          src={`/foto-profil/${detail.users_pengaduan_id_pelaporTousers.foto_profil}`}
                          className="w-full h-full object-cover"
                          alt="Pelapor"
                        />
                      ) : (
                        <User size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          Terkait Santri: {detail.users_pengaduan_id_santriTousers?.nama}
                        </p>
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(detail.waktu_aduan).toLocaleDateString("id-ID")} • {formatTime(detail.waktu_aduan)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${detail.status === "Selesai" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {detail.status || "Aktif"}
                      </span>
                    </div>
                    <h4 className={`font-bold text-md mb-1 ${detail.status === "Selesai" ? "text-green-700" : "text-orange-600"}`}>
                      {detail.judul}
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{detail.deskripsi}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Riwayat Percakapan</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {/* List Percakapan */}
              {detail.tanggapan_aduan.map((chat) => {
                const isMe = chat.users?.id === currentUserId;
                const roleLabel = chat.users?.user_role?.[0]?.role?.role || "";
                const isDeleted = chat.is_active === false;
                const isRevealed = revealedChats[chat.id];

                const bubbleRadius = isMe ? "rounded-l-xl rounded-tr-xl rounded-br-[2px]" : "rounded-r-xl rounded-tl-xl rounded-bl-[2px]";
                const bubbleColor = isDeleted ? "bg-red-50 border border-red-300 border-dashed text-red-900" : isMe ? "bg-green-600 text-white" : "bg-white text-gray-700 border border-gray-100";

                return (
                  <div key={chat.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} items-center`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-sm overflow-hidden ${isMe && !isDeleted ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                      {chat.users?.foto_profil ? (
                        <img src={`/foto-profil/${chat.users.foto_profil}`} className="w-full h-full object-cover" alt="User" />
                      ) : (
                        chat.users?.nama?.charAt(0)
                      )}
                    </div>

                    <div className="flex flex-col max-w-[80%]">
                      {isDeleted && !isRevealed ? (
                        <div className="bg-gray-200/50 border border-dashed border-gray-300 text-gray-500 p-3 rounded-xl text-xs text-center flex flex-col items-center">
                          <span className="flex items-center">
                            <div>🚫 </div>
                            <div className="italic ml-1">Pesan ini telah dihapus oleh Admin pesantren.</div>
                          </span>
                          {currentRole === "admin" && (
                            <button onClick={() => toggleRevealChat(chat.id)} className="mt-2 text-[10px] font-bold text-green-600 hover:text-green-800 flex items-center transition">
                              <Eye size={12} className="mr-1" /> Lihat Pesan Asli
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className={`p-3 shadow-sm text-sm relative ${bubbleRadius} ${bubbleColor}`}>
                          {isDeleted && isRevealed && (
                            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-red-200/50">
                              <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">TERHAPUS</span>
                              <button onClick={() => toggleRevealChat(chat.id)} className="text-[10px] font-bold text-red-400 hover:text-red-700 flex items-center transition">
                                <EyeOff size={12} className="mr-1" /> Sembunyikan
                              </button>
                            </div>
                          )}
                          {!isMe && (
                            <p className={`text-[10px] font-bold mb-1 ${isDeleted ? "text-red-700" : "text-green-600"}`}>
                              {chat.users?.nama} <span className={`font-normal ml-1 capitalize ${isDeleted ? "text-red-500/80" : "text-gray-400"}`}>({roleLabel})</span>
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{chat.tanggapan}</p>
                          <p className={`text-[9px] mt-1 text-right ${isMe && !isDeleted ? "text-green-200" : isDeleted ? "text-red-400" : "text-gray-400"}`}>
                            {formatTime(chat.waktu_tanggapan)}
                          </p>
                        </div>
                      )}
                    </div>

                    {currentRole === "admin" && !isDeleted && (
                      <button onClick={() => handleDelete(chat)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition" title="Hapus Pesan">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              {detail.tanggapan_aduan.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm italic">Belum ada tanggapan. Mulai diskusi sekarang.</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-red-500">Data tidak ditemukan</p>
          )}
        </div>

        {/* Footer: Form Chat */}
        <div className="p-4 bg-white border-t border-gray-100">
          {canReply && detail?.status !== "Selesai" ? (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={tanggapan}
                onChange={(e) => setTanggapan(e.target.value)}
                placeholder="Tulis tanggapan Anda..."
                rows="1"
                className="flex-1 min-h-[44px] max-h-[124px] overflow-y-auto p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none text-sm bg-gray-50 transition-all duration-200 [scrollbar-width:none]"
              />
              <button
                onClick={handleKirim}
                disabled={sending || !tanggapan.trim()}
                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition flex-shrink-0 flex items-center shadow-md"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                <Lock size={14} className="text-gray-500" />
              </div>
              <p className="text-xs font-semibold text-gray-600">Laporan Telah Ditutup</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })} onConfirm={confirmDelete} loading={isDeleting} itemName={deleteModal.name} />
    </div>
  );
}