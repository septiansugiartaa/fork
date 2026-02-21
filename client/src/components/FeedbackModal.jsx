import { useState, useEffect } from "react";
import { X, Star, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

// PERUBAHAN: props 'kegiatan' diganti jadi 'item' biar universal
export default function FeedbackModal({ isOpen, onClose, item, onSubmit, saving }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
        setRating(0);
        setReview("");
        setMessage({ type: "", text: "" });
    }
  }, [isOpen, item]);

  // PERUBAHAN: Cek 'item' bukan 'kegiatan'
  if (!isOpen || !item) return null;

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => { setMessage({ type: "", text: "" }); }, 3000);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      showAlert("error", "Silakan beri rating bintang terlebih dahulu.");
      return;
    }
    if (!review.trim()) {
      showAlert("error", "Silakan isi ulasan pengalaman Anda.");
      return;
    }
    // Kirim ID ke parent
    onSubmit(item.id, rating, review);
  };

  // LOGIC JUDUL: Cek apakah ini Kegiatan (punya .nama) atau Layanan (punya .nama_layanan)
  const displayTitle = item.nama || item.nama_layanan || "Item";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 relative">
        
        {/* Alert Component */}
        {message.text && (
            <div className={`absolute top-4 left-4 right-4 z-[10001] p-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 border-l-4 ${message.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                <div className={`flex-shrink-0 p-1 rounded-full ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                </div>
                <p className="text-xs font-medium flex-1">{message.text}</p>
                <button onClick={() => setMessage({type:"", text:""})} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
        )}

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
        </button>

        <div className="text-center mb-6 mt-4">
            <h3 className="text-xl font-bold text-gray-900">Berikan Umpan Balik</h3>
            <p className="text-gray-500 text-sm mt-1">{displayTitle}</p>
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
            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm resize-none h-32 mb-6 transition"
            placeholder="Ceritakan pengalaman Anda..."
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
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition disabled:bg-green-300 flex items-center justify-center"
            >
                {saving ? <Loader2 className="animate-spin mr-2" size={20} /> : "Kirim"}
            </button>
        </div>

      </div>
    </div>
  );
}