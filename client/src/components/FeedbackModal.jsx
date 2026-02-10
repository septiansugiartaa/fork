import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";

export default function FeedbackModal({ isOpen, onClose, kegiatan, onSubmit, saving }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); // Efek hover bintang
  const [review, setReview] = useState("");

  if (!isOpen || !kegiatan) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Silakan beri rating bintang terlebih dahulu.");
      return;
    }
    if (!review.trim()) {
      alert("Silakan isi ulasan pengalaman Anda.");
      return;
    }
    onSubmit(kegiatan.id, rating, review);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
        </button>

        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Berikan Umpan Balik</h3>
            <p className="text-gray-500 text-sm mt-1">{kegiatan.nama}</p>
        </div>

        {/* Rating Bintang */}
        <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition transform hover:scale-110 focus:outline-none"
                >
                    <Star 
                        size={36} 
                        className={`${(hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors duration-200`} 
                    />
                </button>
            ))}
        </div>
        <p className="text-center text-gray-500 text-sm mb-6 font-medium">
            {rating > 0 ? `${rating} dari 5 Bintang` : "Sentuh bintang untuk menilai"}
        </p>

        {/* Textarea */}
        <textarea 
            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none h-32 mb-6 transition"
            placeholder="Ceritakan pengalaman Anda mengikuti kegiatan ini..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
        ></textarea>

        <div className="flex gap-3">
            <button 
                onClick={onClose} 
                disabled={saving}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
            >
                Tutup
            </button>
            <button 
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:bg-blue-300 flex items-center justify-center"
            >
                {saving ? <Loader2 className="animate-spin mr-2" size={20} /> : "Kirim Umpan Balik"}
            </button>
        </div>

      </div>
    </div>
  );
}