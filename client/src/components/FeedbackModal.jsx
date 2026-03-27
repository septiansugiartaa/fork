import React, { useState, useEffect } from "react";
import { X, Star, Loader2, CheckCircle } from "lucide-react";
import AlertToast from "../components/AlertToast";
import { useAlert } from "../hooks/useAlert";

export default function FeedbackModal({ isOpen, onClose, item, onSubmit, saving }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const { message, showAlert, clearAlert } = useAlert();

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setReview("");
      setMessage({ type: "", text: "" });
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = () => {
    if (rating === 0) return showAlert("error", "Silakan beri rating bintang.");
    if (!review.trim()) return showAlert("error", "Silakan isi ulasan Anda.");
    onSubmit(item.id, rating, review);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <AlertToast message={message} onClose={clearAlert} />

        <div className="flex justify-between items-center mb-6 pt-4">
          <div><h3 className="text-xl font-bold text-gray-800">Beri Ulasan</h3><p className="text-xs text-gray-500 mt-0.5">{item.nama}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <button key={i} onClick={() => setRating(i + 1)} onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}>
              <Star size={36} className={`${(hoverRating || rating) > i ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} transition-colors duration-200`} />
            </button>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mb-6 font-medium">{rating > 0 ? `${rating} dari 5 Bintang` : "Ketuk bintang untuk menilai"}</p>

        <textarea className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none h-32 mb-6 transition" placeholder="Ceritakan pengalaman Anda..." value={review} onChange={(e) => setReview(e.target.value)}></textarea>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl transition hover:bg-gray-200">Tutup</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition hover:bg-green-700 shadow-lg disabled:opacity-70">
            {saving && <Loader2 className="animate-spin" size={20} />} {saving ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </div>
      </div>
    </div>
  );
}