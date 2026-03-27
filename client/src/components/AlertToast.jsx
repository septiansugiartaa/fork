import { AlertTriangle, CheckCircle, X } from "lucide-react";

export default function AlertToast({ message, onClose }) {
  if (!message?.text) return null;

  const isError = message.type === "error";

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[11000] min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300 border-l-4 bg-white ${
        isError ? "border-red-500 text-red-700" : "border-green-500 text-green-700"
      }`}
    >
      <div className={`flex-shrink-0 p-2 rounded-full ${isError ? "bg-red-100" : "bg-green-100"}`}>
        {isError ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
      </div>
      <p className="text-sm font-medium flex-1">{message.text}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  );
}
