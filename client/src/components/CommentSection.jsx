import { useEffect, useState } from "react";
import api from "../config/api";
import { MessageCircle, Send, ChevronDown } from "lucide-react";

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
};

const formatRole = (role) => {
  const map = {
    santri: "Santri",
    timkesehatan: "Tim Kesehatan",
    pimpinan: "Pimpinan",
    admin: "Admin",
    ustadz: "Ustadz",
    pengurus: "Pengurus"
  };
  return map[role?.toLowerCase()] || "Pengguna";
};

const Avatar = ({ user }) => {
  if (user?.foto_profil) {
    return (
      <img
        src={`/foto-profil/${user.foto_profil}`}
        alt={user.nama}
        className="w-9 h-9 rounded-full object-cover border border-gray-200"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm border border-green-200">
      {(user?.nama || "U").charAt(0).toUpperCase()}
    </div>
  );
};

function ReplyItem({ reply }) {
  return (
    <div className="flex gap-3 pl-12 pt-3">
      <Avatar user={reply.user} />
      <div className="flex-1 bg-gray-50 rounded-xl p-3">
        <p className="text-sm font-semibold text-gray-800">{reply.user?.nama || "Pengguna"}</p>
        <p className="text-xs text-green-700 font-medium mb-1">{formatRole(reply.user?.role)}</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.isi_reply}</p>
        <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(reply.created_at)}</p>
      </div>
    </div>
  );
}

export default function CommentSection({ materiId }) {
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTextByComment, setReplyTextByComment] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyFor, setSubmittingReplyFor] = useState(null);

  const fetchComments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/global/manageMateri/${materiId}/comments`, {
        params: { commentPage: page, commentLimit: 5, replyLimit: 5 }
      });

      const newComments = res.data?.data || [];
      if (page === 1) {
        setComments(newComments);
      } else {
        setComments((prev) => [...prev, ...newComments]);
      }

      setHasMoreComments(Boolean(res.data?.pagination?.hasMore));
    } catch (error) {
      console.error("Gagal memuat komentar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!materiId) return;
    fetchComments(1);
    setCommentPage(1);
  }, [materiId]);

  const handleKirimKomentar = async () => {
    if (!commentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await api.post(`/global/manageMateri/${materiId}/comments`, {
        isi_comment: commentText.trim()
      });
      setCommentText("");
      setCommentPage(1);
      fetchComments(1);
    } catch (error) {
      console.error("Gagal mengirim komentar:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKirimReply = async (idComment) => {
    const text = replyTextByComment[idComment];
    if (!text?.trim() || submittingReplyFor) return;

    try {
      setSubmittingReplyFor(idComment);
      await api.post(`/global/manageMateri/comments/${idComment}/replies`, {
        isi_reply: text.trim()
      });

      setReplyTextByComment((prev) => ({ ...prev, [idComment]: "" }));
      fetchComments(1);
    } catch (error) {
      console.error("Gagal mengirim balasan:", error);
    } finally {
      setSubmittingReplyFor(null);
    }
  };

  const handleLoadMoreReplies = async (idComment) => {
    const comment = comments.find((item) => item.id_comment === idComment);
    if (!comment) return;

    const nextPage = Math.floor((comment.replies?.length || 0) / 5) + 1;

    try {
      const res = await api.get(`/global/manageMateri/comments/${idComment}/replies`, {
        params: { page: nextPage, limit: 5 }
      });

      const newRows = res.data?.data || [];
      const hasMore = Boolean(res.data?.pagination?.hasMore);

      setComments((prev) =>
        prev.map((item) => {
          if (item.id_comment !== idComment) return item;
          return {
            ...item,
            replies: [...(item.replies || []), ...newRows],
            has_more_replies: hasMore
          };
        })
      );
    } catch (error) {
      console.error("Gagal memuat balasan lanjutan:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="text-green-600" size={20} />
        <h3 className="font-bold text-gray-800 text-lg">Diskusi Materi</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-start gap-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tulis komentar..."
            className="w-full min-h-[72px] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-400 outline-none"
          />
          <button
            onClick={handleKirimKomentar}
            disabled={submittingComment}
            className="h-[44px] px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
          >
            <Send size={15} />
            Kirim
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Memuat komentar...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">Belum ada komentar.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id_comment} className="border border-gray-100 rounded-xl p-3">
              <div className="flex gap-3">
                <Avatar user={comment.user} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{comment.user?.nama || "Pengguna"}</p>
                  <p className="text-xs text-green-700 font-medium mb-1">{formatRole(comment.user?.role)}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.isi_comment}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(comment.created_at)}</p>
                </div>
              </div>

              {(comment.replies || []).map((reply) => (
                <ReplyItem key={reply.id_reply} reply={reply} />
              ))}

              {comment.has_more_replies && (
                <button
                  onClick={() => handleLoadMoreReplies(comment.id_comment)}
                  className="pl-12 mt-2 text-sm text-green-700 hover:underline flex items-center gap-1"
                >
                  <ChevronDown size={14} />
                  Lihat balasan lanjutan
                </button>
              )}

                <div className="pl-12 mt-3 flex items-start gap-2">
                  <input
                    value={replyTextByComment[comment.id_comment] || ""}
                    onChange={(e) =>
                      setReplyTextByComment((prev) => ({
                        ...prev,
                        [comment.id_comment]: e.target.value
                      }))
                    }
                    placeholder="Balas komentar ini..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-400 outline-none"
                  />
                  <button
                    onClick={() => handleKirimReply(comment.id_comment)}
                    disabled={submittingReplyFor === comment.id_comment}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Balas
                  </button>
                </div>
            </div>
          ))}

          {hasMoreComments && (
            <button
              onClick={() => {
                const next = commentPage + 1;
                setCommentPage(next);
                fetchComments(next);
              }}
              className="text-sm text-green-700 hover:underline"
            >
              Lihat komentar lebih banyak
            </button>
          )}
        </div>
      )}
    </div>
  );
}
