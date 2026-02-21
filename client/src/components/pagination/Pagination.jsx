import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onNext, onPrev }) {
  // Jika data kosong atau cuma 1 halaman, sembunyikan pagination
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm mt-4">
      <button 
        onClick={onPrev} 
        disabled={currentPage === 1} 
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
      >
        <ChevronLeft size={20}/>
      </button>
      
      <span className="text-sm font-medium text-gray-600">
        Halaman <span className="text-green-600 font-bold">{currentPage}</span> dari {totalPages}
      </span>

      <button 
        onClick={onNext} 
        disabled={currentPage === totalPages} 
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
      >
        <ChevronRight size={20}/>
      </button>
    </div>
  );
}