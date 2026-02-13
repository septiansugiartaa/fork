import React from 'react';

export default function PengurusDashboard() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Pengurus</h1>
        <p className="text-gray-500 mt-1">Selamat datang di panel administrasi SIM-Tren.</p>
      </div>

      {/* Empty State Container */}
      <div className="grid grid-cols-1 gap-6 min-h-[400px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed border-2 flex flex-col items-center justify-center p-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">🚧</span>
            </div>
            <h3 className="text-lg font-medium text-gray-600">Area Konten Dashboard</h3>
            <p className="text-sm mt-1">Belum ada widget atau statistik yang ditampilkan.</p>
        </div>
      </div>
    </div>
  );
}