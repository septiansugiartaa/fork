import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const normalizeRoom = (room) => ({
  ...room,
  id: room?.id ?? room?.id_room,
  closed_reason_type: room?.closed_reason_type ?? room?.close_reason_type,
});

const getDateTitle = (dateValue) => {
  if (!dateValue) return 'Tanpa Tanggal';
  return new Date(dateValue).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const groupRoomsByDate = (items = []) => {
  const groups = [];

  items.forEach((room) => {
    const title = getDateTitle(room.closed_at);
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || lastGroup.title !== title) {
      groups.push({ title, rooms: [room] });
      return;
    }

    lastGroup.rooms.push(room);
  });

  return groups;
};

const getDateKey = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSantriName = (room) => room?.santri?.nama || room?.santri_name || 'Tanpa Nama Santri';

const formatRoomchatTime = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const PAGE_SIZE = 6;

export default function TimkesKonsultasiRiwayatPage() {
  const [rooms, setRooms] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSantri, setSelectedSantri] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  
  const santriOptions = useMemo(() => {
    return [...new Set(santriList.map((item) => item?.nama).filter(Boolean))];
  }, [santriList]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchDate = !selectedDate || getDateKey(room.closed_at) === selectedDate;
      const santriName = getSantriName(room);
      const matchSantri = !selectedSantri || santriName === selectedSantri;
      return matchDate && matchSantri;
    });
  }, [rooms, selectedDate, selectedSantri]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRooms = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredRooms.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredRooms, safeCurrentPage]);

  const groupedRooms = useMemo(() => groupRoomsByDate(paginatedRooms), [paginatedRooms]);

  useEffect(() => {
    Promise.all([
      api.get('/timkesehatan/konsultasi/rooms/history'),
      api.get('/timkesehatan/konsultasi/santri'),
    ])
      .then(([historyResponse, santriResponse]) => {
        setRooms((historyResponse?.data?.data || []).map(normalizeRoom));
        setSantriList(santriResponse?.data?.data || []);
      })
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
        <div className='px-4 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div>
            <label className='text-xs font-medium text-gray-600 block mb-1'>Filter Tanggal</label>
            <input
              type='date'
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-100'
            />
          </div>
          <div>
            <label className='text-xs font-medium text-gray-600 block mb-1'>Filter Nama Santri</label>
            <select
              value={selectedSantri}
              onChange={(e) => {
                setSelectedSantri(e.target.value);
                setCurrentPage(1);
              }}
              className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-100 bg-white'
            >
              <option value=''>Semua Santri</option>
              {santriOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className='py-2'>
          {groupedRooms.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`} className={`${groupIndex === 0 ? 'mt-0' : 'mt-4'} mb-2`}>
              <div className='mx-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm font-bold tracking-wide text-green-800 shadow-sm'>
                {group.title}
              </div>
              {group.rooms.map((room) => (
                <button key={room.id} onClick={() => navigate(`/timkesehatan/konsultasi?room=${room.id}`)} className='w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0'>
                  <div className='font-semibold text-gray-800'>{room.santri?.nama || '-'}</div>
                  <div className='text-xs text-gray-500 mt-1'>Ditutup: {formatRoomchatTime(room.closed_at)}</div>
                  <div className='text-xs text-gray-500 mt-1'>Alasan: {room.closed_reason_text || '-'}</div>
                </button>
              ))}
            </div>
          ))}
          {filteredRooms.length === 0 && <div className='p-8 text-center text-gray-500'>Tidak ada riwayat percakapan.</div>}
        </div>
        {filteredRooms.length > 0 && (
          <div className='px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3'>
            <p className='text-xs text-gray-500'>
              Halaman {safeCurrentPage} dari {totalPages} • Total {filteredRooms.length} riwayat
            </p>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className='px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50'
              >
                Sebelumnya
              </button>
              <button
                type='button'
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className='px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50'
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
