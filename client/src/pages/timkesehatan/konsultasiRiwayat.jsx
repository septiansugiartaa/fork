import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const normalizeRoom = (room) => ({
  ...room,
  id: room?.id ?? room?.id_room,
  closed_reason_type: room?.closed_reason_type ?? room?.close_reason_type,
});

export default function TimkesKonsultasiRiwayatPage() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/timkesehatan/konsultasi/rooms/history')
.then(({ data }) => setRooms((data?.data || []).map(normalizeRoom)))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className='p-4 bg-gray-50 min-h-[calc(100vh-80px)]'>
      <div className='max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-gray-100 flex items-center gap-3'>
          <button onClick={() => navigate('/timkesehatan/konsultasi')} className='p-2 rounded-full hover:bg-gray-100'><ArrowLeft size={18} /></button>
          <div>
            <h1 className='font-bold text-gray-800'>Riwayat Konsultasi</h1>
            <p className='text-xs text-gray-500'>Menampilkan room dengan status closed.</p>
          </div>
        </div>
        <div className='divide-y divide-gray-100'>
          {rooms.map((room) => (
            <button key={room.id} onClick={() => navigate(`/timkesehatan/konsultasi?room=${room.id}`)} className='w-full p-4 text-left hover:bg-gray-50'>
              <div className='font-semibold text-gray-800'>{room.santri?.nama || '-'}</div>
              <div className='text-xs text-gray-500 mt-1'>Ditutup: {room.closed_at ? new Date(room.closed_at).toLocaleString('id-ID') : '-'}</div>
              <div className='text-sm text-gray-600 mt-1'>{room.closed_reason_text || '-'}</div>
            </button>
          ))}
          {rooms.length === 0 && <div className='p-8 text-center text-gray-500'>Belum ada riwayat konsultasi.</div>}
        </div>
      </div>
    </div>
  );
}
