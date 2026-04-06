import { ArrowLeft, MessageCircleHeart, Clock3, UserRound, History } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";

const normalizeRoom = (room) => ({
  ...room,
  id: room?.id ?? room?.id_room,
  closed_reason_type: room?.closed_reason_type ?? room?.close_reason_type,
  last_message: room?.last_message
    ? {
        ...room.last_message,
        id: room.last_message.id ?? room.last_message.id_message,
        message_text: room.last_message.message_text ?? room.last_message.messgae_text,
      }
    : null,
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

const getTimkesName = (room) => room?.timkes?.nama || room?.timkes_name || 'Tanpa Nama Timkes';

const formatRoomchatTime = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const PAGE_SIZE = 6;

export default function SantriScabiesKonsultasi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timkesList, setTimkesList] = useState([]);
  const [historyRooms, setHistoryRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('timkes');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimkes, setSelectedTimkes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const hasLoadedRef = useRef(false);
  const historyTimkesOptions = useMemo(() => {
    return [...new Set(timkesList.map((item) => item?.nama).filter(Boolean))];
  }, [timkesList]);

  const filteredHistoryRooms = useMemo(() => {
    return historyRooms.filter((room) => {
      const matchDate = !selectedDate || getDateKey(room.closed_at) === selectedDate;
      const timkesName = getTimkesName(room);
      const matchTimkes = !selectedTimkes || timkesName === selectedTimkes;
      return matchDate && matchTimkes;
    });
  }, [historyRooms, selectedDate, selectedTimkes]);

  const totalPages = Math.max(1, Math.ceil(filteredHistoryRooms.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedHistoryRooms = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredHistoryRooms.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredHistoryRooms, safeCurrentPage]);

  const groupedHistoryRooms = useMemo(() => groupRoomsByDate(paginatedHistoryRooms), [paginatedHistoryRooms]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentRes, timkesRes, historyRes] = await Promise.all([
        api.get('/santri/konsultasi/room/me/current'),
        api.get('/santri/konsultasi/timkes'),
        api.get('/santri/konsultasi/rooms/history'),
      ]);

      if (currentRes.data?.data?.id) {
        navigate(`/santri/scabies/konsultasi/room/${currentRes.data.data.id}`);
        return;
      }

      setTimkesList(timkesRes.data?.data || []);
      setHistoryRooms((historyRes.data?.data || []).map(normalizeRoom));
    } catch (error) {
      console.error('Gagal memuat halaman konsultasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadData();
  }, []);

  const startConsultation = async (idTimkes) => {
    try {
      const { data } = await api.post('/santri/konsultasi/rooms', { id_timkes: idTimkes });
      if (data?.data?.id) {
        navigate(`/santri/scabies/konsultasi/room/${data.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal membuat room konsultasi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/santri/scabies')} className="flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Konsultasi Tim Kesehatan</h1>
            <p className="text-green-100 text-sm">Pilih tim kesehatan atau lihat riwayat percakapan.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <button onClick={() => setActiveTab('timkes')} className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === 'timkes' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Daftar Tim Kesehatan
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${activeTab === 'history' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              <History size={16} /> Riwayat Percakapan
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-600 font-medium">Memuat data konsultasi...</p>
            </div>
          ) : activeTab === 'timkes' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-4 w-[20%]">Nama</th>
                    <th className="text-left p-4 w-[15%]">Slot</th>
                    <th className="text-left p-4 w-[15%]">Status</th>
                    <th className="text-left p-4 w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {timkesList.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-800 font-medium"><UserRound size={16} /> {item.nama}</div>
                      </td>
                      <td className="p-4 text-gray-700">{item.active_count}/{item.max_slot}</td>
                      <td className="p-4">
                        {item.is_full ? <span className="px-2.5 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Full</span> : <span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700">Tersedia</span>}
                      </td>
                      <td className="p-4">
                        <button onClick={() => startConsultation(item.id)} className="px-3 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700">
                          Mulai Konsultasi
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timkesList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">Belum ada tim kesehatan tersedia.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Filter Tanggal</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Filter Nama Timkes</label>
                  <select
                    value={selectedTimkes}
                    onChange={(e) => {
                      setSelectedTimkes(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-100 bg-white"
                  >
                    <option value="">Semua Timkes</option>
                    {historyTimkesOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="py-2">
              {groupedHistoryRooms.map((group, groupIndex) => (
                <div key={`${group.title}-${groupIndex}`} className={`${groupIndex === 0 ? 'mt-0' : 'mt-4'} mb-2`}>
                  <div className="mx-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm font-bold tracking-wide text-green-800 shadow-sm">
                    {group.title}
                  </div>
                  {group.rooms.map((room) => (
                    <button key={room.id} onClick={() => navigate(`/santri/scabies/konsultasi/room/${room.id}`)} className="w-full text-left p-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                      <div className="font-semibold text-gray-800">{room.timkes?.nama || 'Tim Kesehatan'}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock3 size={13} /> Ditutup: {formatRoomchatTime(room.closed_at)}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">Alasan: {room.last_message?.message_text || 'Tidak ada pesan.'}</div>
                    </button>
                  ))}
                </div>
              ))}
              {filteredHistoryRooms.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  <MessageCircleHeart className="mx-auto mb-2 text-gray-300" />
                  Tidak ada riwayat roomchat.
                </div>
              )}
              </div>

              {filteredHistoryRooms.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    Halaman {safeCurrentPage} dari {totalPages} • Total {filteredHistoryRooms.length} riwayat
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}