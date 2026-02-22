import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TimkesDashboard() {
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Tim Kesehatan</h1>
        <p className="text-gray-500 mt-1">Selamat datang di panel Dashboard Tim Kesehatan.</p>
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
        <div className='flex justify-center items-center'>
          <button onClick={handleLogout} className='px-3 py-3 font-semibold bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white cursor_pointer transition duration-200'>Logout</button>
        </div>
      </div>
    </div>
  );
}