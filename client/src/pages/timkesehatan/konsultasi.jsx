import { MessageCircle, History, Send, CheckCheck, Check, X, User, ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../config/api';

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

const getProfileSrc = (fotoProfil) => {
  if (!fotoProfil || fotoProfil === '-') return null;
  if (fotoProfil.startsWith('http')) return fotoProfil;
  return `/foto-profil/${fotoProfil}`;
};

const getAvatarColor = (name = '') => {
  const hash = [...String(name)].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};


const ProfileAvatar = ({ fotoProfil, nama, className = '' }) => {
  const profileSrc = getProfileSrc(fotoProfil);
  if (profileSrc) {
    return <img src={profileSrc} alt={nama || 'Santri'} className={`${className} rounded-full object-cover`} />;
  }

  return (
    <div className={`${className} rounded-full flex items-center justify-center text-white ${getAvatarColor(nama)}`} aria-label={nama || 'Santri'}>
      <User size={18} />
    </div>
  );
};

const normalizeMessage = (item) => ({
  ...item,
  id: item?.id ?? item?.id_message,
  message_text: item?.message_text ?? item?.messgae_text,
});

const normalizeRoom = (room) => {
  if (!room) return null;

  const normalizedSantri = {
    id: room?.santri?.id ?? room?.id_santri ?? null,
    nama: room?.santri?.nama ?? room?.nama_santri ?? room?.santri_nama ?? '-',
    foto_profil: room?.santri?.foto_profil ?? room?.foto_profil ?? room?.santri_foto_profil ?? null,
  };

  return {
    ...room,
    id: room?.id ?? room?.id_room,
    santri: normalizedSantri,
    closed_reason_type: room?.closed_reason_type ?? room?.close_reason_type,
    last_message: room?.last_message ? normalizeMessage(room.last_message) : null,
  };
};

const formatRoomchatTime = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const MESSAGE_POLLING_INTERVAL_MS = 3000;

export default function TimkesKonsultasiPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [closingReason, setClosingReason] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [healthSummary, setHealthSummary] = useState({ santri: null, screening: [], observasi: [] });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const lastMarkedReadRef = useRef({});
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 767px)').matches
    : false));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const onViewportChange = (event) => {
      setIsMobileView(event.matches);
    };

    setIsMobileView(mediaQuery.matches);
    mediaQuery.addEventListener('change', onViewportChange);
    return () => mediaQuery.removeEventListener('change', onViewportChange);
  }, []);

  const fetchRooms = useCallback(async () => {
    const { data } = await api.get('/timkesehatan/konsultasi/rooms/active');
    const items = (data?.data || []).map(normalizeRoom);
    const visibleRooms = items.filter((room) => room?.last_message?.id);
    setRooms(visibleRooms);
    if (!selectedRoomId) {
      const fromQuery = Number(searchParams.get('room'));
      if (fromQuery) {
        setSelectedRoomId(fromQuery);
      } else if (!isMobileView && visibleRooms[0]?.id) {
        setSelectedRoomId(visibleRooms[0].id);
      }
      return;
    }

    if (selectedRoomId && !visibleRooms.find((r) => r.id === selectedRoomId) && !searchParams.get('room')) {
      if (isMobileView) {
        setSelectedRoomId(null);
      } else {
        setSelectedRoomId(visibleRooms[0]?.id || null);
      }
    }
  }, [isMobileView, searchParams, selectedRoomId]);

  const markRoomAsRead = useCallback(async (roomId, items) => {
    if (!roomId || !items?.length) return;

    const lastIncomingMessage = [...items].reverse().find((item) => item.sender_role !== 'timkesehatan');
    const lastMessageId = lastIncomingMessage?.id;
    if (!lastMessageId || lastMarkedReadRef.current[roomId] === lastMessageId) return;

    await api.post(`/timkesehatan/konsultasi/rooms/${roomId}/read`, { last_read_message_id: lastMessageId });
    lastMarkedReadRef.current[roomId] = lastMessageId;
  }, []);

  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId) {
      setMessages([]);
      setSelectedRoom(null);
      return;
    }
    const { data } = await api.get(`/timkesehatan/konsultasi/rooms/${roomId}/messages`);
    const items = (data?.data?.messages || []).map(normalizeMessage);
    setMessages(items);
    setSelectedRoom(normalizeRoom(data?.data?.room || null));
    await markRoomAsRead(roomId, items);
  }, [markRoomAsRead]);

  useEffect(() => {
    const runner = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      try {
        await fetchRooms();
        if (selectedRoomId) {
          await fetchMessages(selectedRoomId);
        }
      } catch (error) {
        console.error(error);
      }
    };
    runner();
    const interval = setInterval(runner, MESSAGE_POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchRooms, selectedRoomId]);

  useEffect(() => {
    fetchMessages(selectedRoomId).catch(console.error);
  }, [fetchMessages, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) return undefined;

    const interval = setInterval(() => {
      fetchMessages(selectedRoomId).catch(console.error);
    }, MESSAGE_POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchMessages, selectedRoomId]);

  useEffect(() => {
    setShowInfoPanel(false);
  }, [selectedRoomId]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!showInfoPanel || !selectedRoomId) return;
      try {
        const { data } = await api.get(`/timkesehatan/konsultasi/rooms/${selectedRoomId}/health-summary`);
        setHealthSummary(data?.data || { santri: null, screening: [], observasi: [] });
      } catch (error) {
        console.error('Gagal memuat ringkasan kesehatan santri:', error);
      }
    };
    fetchSummary();
  }, [showInfoPanel, selectedRoomId]);

  const selectedRoomFromList = rooms.find((r) => r.id === selectedRoomId);
  const roomHeader = selectedRoomFromList || selectedRoom || null;

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = '';
    for (const msg of messages) {
      const dateKey = new Date(msg.sent_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ type: 'date', value: dateKey, id: `date-${dateKey}` });
      }
      groups.push({ type: 'message', value: msg, id: `msg-${msg.id}` });
    }
    return groups;
  }, [messages]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, selectedRoomId]);

  const submitMessage = async () => {
    if (!selectedRoomId || !message.trim() || isSending) return;
    try {
      setIsSending(true);
      const { data } = await api.post(`/timkesehatan/konsultasi/rooms/${selectedRoomId}/messages`, { message });
      setMessage('');
      const sentMessage = normalizeMessage(data?.data || {});
      if (sentMessage?.id) {
        setMessages((prev) => [...prev, sentMessage]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const closeRoom = async () => {
    if (!closingReason.trim()) return alert('Alasan wajib diisi');
    await api.post(`/timkesehatan/konsultasi/rooms/${selectedRoomId}/close`, { reason_text: closingReason });
    setClosingReason('');
    setShowCloseModal(false);
    await fetchRooms();
  };

  return (
    <div className='h-[calc(100vh-170px)]'>
      <div className={`h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${isMobileView ? 'flex' : 'grid grid-cols-12'}`}>
        <div className={`${isMobileView && selectedRoomId ? 'hidden' : 'flex'} ${isMobileView ? 'w-full' : 'col-span-4'} border-r border-gray-100 flex-col min-h-0`}>
          <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
            <h2 className='font-bold text-gray-800'>Konsultasi Aktif</h2>
            <button onClick={() => navigate('/timkesehatan/konsultasi/riwayat')} className='px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1'>
              <History size={14} /> Riwayat
            </button>
          </div>

          <div className='overflow-y-auto flex-1'>
            {rooms.map((room) => (
              <button key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`w-full text-left p-4 border-b border-gray-100 ${selectedRoomId === room.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                <div className='flex items-start gap-3'>
                  <ProfileAvatar
                    fotoProfil={room.santri?.foto_profil}
                    nama={room.santri?.nama}
                    className='w-11 h-11 flex-shrink-0'
                  />
                  <div className='min-w-0 flex-1 flex gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold text-gray-800 truncate'>{room.santri?.nama || '-'}</p>
                      <p className='text-xs text-gray-500 mt-1 truncate'>{room.last_message?.message_text || 'Belum ada pesan'}</p>
                    </div>
                    <div className='flex flex-col items-end justify-between gap-1 min-w-[54px]'>
                      <span className='text-[11px] text-gray-400 whitespace-nowrap'>
                        {formatRoomchatTime(room.last_message?.sent_at)}
                      </span>
                      {!!room.unread_count && <span className='inline-block px-2 py-0.5 rounded-full text-xs bg-green-600 text-white'>{room.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {rooms.length === 0 && <div className='p-6 text-center text-gray-500 text-sm'>Belum ada room aktif.</div>}
          </div>
        </div>

         <div className={`${isMobileView ? (selectedRoomId ? 'flex w-full' : 'hidden') : 'col-span-8 flex'} flex-col min-h-0 relative`}>
          <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
            <div className='flex items-center gap-2 min-w-0'>
              {isMobileView && selectedRoomId && (
                <button type='button' onClick={() => setSelectedRoomId(null)} className='p-2 rounded-lg hover:bg-gray-100 text-gray-600'>
                  <ArrowLeft size={18} />
                </button>
              )}
              <button type='button' onClick={() => roomHeader && setShowInfoPanel(true)} className='text-left flex items-center gap-3 min-w-0'>
               <ProfileAvatar
                fotoProfil={roomHeader?.santri?.foto_profil}
                nama={roomHeader?.santri?.nama}
                className='w-10 h-10'
              />
              <div className='min-w-0'>
                <p className='font-semibold text-gray-800 truncate'>{roomHeader?.santri?.nama || '-'}</p>
                <p className='text-xs text-gray-500'>Status: {roomHeader?.status || '-'}</p>
              </div>
            </button>
            </div>
            <div className='flex items-center gap-2'>
              {selectedRoomId && roomHeader?.status !== 'closed' && (
                <button onClick={() => setShowCloseModal(true)} className='px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold'>Konsultasi Selesai</button>
              )}
            </div>
          </div>

          <div ref={chatContainerRef} className='flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-0'>
            {groupedMessages.map((entry) => {
              if (entry.type === 'date') {
                return (
                  <div key={entry.id} className='flex justify-center'>
                    <span className='px-3 py-1 text-[11px] rounded-full bg-gray-200 text-gray-600'>{entry.value}</span>
                  </div>
                );
              }
              const item = entry.value;
              const isMe = item.sender_role === 'timkesehatan';
              return (
                <div key={entry.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-white border border-gray-200 rounded-bl-md'}`}>
                    <p className='whitespace-pre-wrap break-words [overflow-wrap:anywhere]'>{item.message_text}</p>
                    <div className={`text-[11px] mt-1 flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400'}`}>
                      {formatRoomchatTime(item.sent_at)}
                      {isMe && (item.read_at ? <CheckCheck size={13} /> : <Check size={13} />)}
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && <div className='text-center text-gray-500 mt-10'><MessageCircle className='mx-auto text-gray-300 mb-1' /> Belum ada pesan.</div>}
          </div>

          <div className='p-3 border-t border-gray-100 flex gap-2'>
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitMessage()} disabled={!selectedRoomId || isSending || roomHeader?.status === 'closed'} className='flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200 disabled:bg-gray-100' placeholder='Tulis pesan...' />
            <button onClick={submitMessage} disabled={!selectedRoomId || isSending || roomHeader?.status === 'closed'} className='p-2.5 rounded-xl bg-green-600 text-white disabled:bg-gray-300'>
              <Send size={16} />
            </button>
          </div>

          <aside className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-20 ${showInfoPanel ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className='p-4 border-b border-gray-100 flex items-center justify-between bg-white/90 backdrop-blur'>
              <div className='flex items-center gap-3 min-w-0'>
                <ProfileAvatar fotoProfil={healthSummary?.santri?.foto_profil || roomHeader?.santri?.foto_profil} nama={roomHeader?.santri?.nama} className='w-11 h-11 border border-gray-200' />
                <div className='min-w-0'>
                  <p className='font-semibold text-gray-800'>Informasi Santri</p>
                  <p className='text-xs text-gray-500 truncate'>{roomHeader?.santri?.nama || '-'}</p>
                </div>
              </div>
              <button onClick={() => setShowInfoPanel(false)} className='p-2 rounded-lg hover:bg-gray-100'>
                <X size={16} />
              </button>
            </div>
            <div className='p-4 space-y-4 overflow-y-auto h-[calc(100%-73px)]'>
              <section className='rounded-2xl bg-white border border-gray-100 p-4 shadow-sm'>
                <h3 className='text-sm font-semibold text-gray-800 mb-3'>Profil Santri</h3>
                <div className='grid grid-cols-[90px_8px_1fr] text-xs gap-y-1.5'>
                  <span className='text-gray-500'>Nama</span><span className='text-gray-400'>:</span><span className='text-gray-700'>{healthSummary?.santri?.nama || roomHeader?.santri?.nama || '-'}</span>
                  <span className='text-gray-500'>NIP</span><span className='text-gray-400'>:</span><span className='text-gray-700'>{healthSummary?.santri?.nip || '-'}</span>
                  <span className='text-gray-500'>Kelas</span><span className='text-gray-400'>:</span><span className='text-gray-700'>{healthSummary?.santri?.kelas || '-'}</span>
                  <span className='text-gray-500'>Kamar</span><span className='text-gray-400'>:</span><span className='text-gray-700'>{healthSummary?.santri?.kamar || '-'}</span>
                  <span className='text-gray-500'>Status</span><span className='text-gray-400'>:</span><span className='text-gray-700'>{healthSummary?.santri?.status || '-'}</span>
                </div>
              </section>

              <section>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='text-sm font-semibold text-gray-800'>2 Screening Terakhir</h3>
                  {roomHeader?.santri?.id && <button className='text-xs text-green-700 font-medium' onClick={() => navigate(`/timkesehatan/daftarSantriScreening/${roomHeader.santri.id}`)}>Lihat Selengkapnya</button>}
                </div>
                <div className='space-y-2'>
                  {healthSummary.screening?.map((item) => (
                    <div key={item.id_screening} className='border border-gray-200 rounded-xl p-3 bg-white'>
                      <div className='text-xs text-gray-500'>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</div>
                      <div className='text-sm font-medium text-gray-800 mt-1'>Diagnosa: {(item.diagnosa || '-').replaceAll('_', ' ')}</div>
                      <div className='text-xs text-gray-600 mt-1'>Status: {item.status || '-'} • Skor: {item.total_skor ?? '-'}</div>
                      <div className='text-xs text-gray-500 mt-1'>Pemeriksa: {item.pemeriksa || '-'}</div>
                    </div>
                  ))}
                  {!healthSummary.screening?.length && <div className='text-xs text-gray-500'>Belum ada data screening.</div>}
                </div>
              </section>

              <section>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='text-sm font-semibold text-gray-800'>2 Observasi Terakhir</h3>
                  {roomHeader?.santri?.id && <button className='text-xs text-green-700 font-medium' onClick={() => navigate(`/timkesehatan/daftarSantriObservasi/${roomHeader.santri.id}`)}>Lihat Selengkapnya</button>}
                </div>
                <div className='space-y-2'>
                  {healthSummary.observasi?.map((item) => (
                    <div key={item.id_observasi} className='border border-gray-200 rounded-xl p-3 bg-white'>
                      <div className='text-xs text-gray-500'>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</div>
                      <div className='text-sm font-medium text-gray-800 mt-1'>Skor: {item.skor_diperoleh ?? '-'}</div>
                      <div className='text-xs text-gray-600 mt-1'>Waktu: {item.waktu || '-'}</div>
                      <div className='text-xs text-gray-500 mt-1'>Pemeriksa: {item.pemeriksa || '-'}</div>
                    </div>
                  ))}
                  {!healthSummary.observasi?.length && <div className='text-xs text-gray-500'>Belum ada data observasi.</div>}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>

      {showCloseModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-5 w-full max-w-md'>
            <h3 className='font-bold text-gray-800'>Selesaikan Konsultasi</h3>
            <p className='text-sm text-gray-500 mt-1'>Tuliskan alasan konsultasi selesai.</p>
            <textarea value={closingReason} onChange={(e) => setClosingReason(e.target.value)} className='w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm min-h-28 outline-none focus:ring-2 focus:ring-green-200' placeholder='Alasan penutupan...' />
            <div className='mt-4 flex justify-end gap-2'>
              <button onClick={() => setShowCloseModal(false)} className='px-4 py-2 rounded-lg bg-gray-100 text-gray-700'>Batal</button>
              <button onClick={closeRoom} className='px-4 py-2 rounded-lg bg-red-600 text-white'>Simpan & Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}