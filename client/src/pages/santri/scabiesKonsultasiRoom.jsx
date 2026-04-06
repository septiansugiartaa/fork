import { ArrowLeft, CheckCheck, Send, Check, CircleCheckBig, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../config/api';

const normalizeMessage = (item) => ({
  ...item,
  id: item?.id ?? item?.id_message,
  message_text: item?.message_text ?? item?.messgae_text,
});

const normalizeRoom = (room) => ({
  ...room,
  id: room?.id ?? room?.id_room,
  closed_reason_type: room?.closed_reason_type ?? room?.close_reason_type,
});

const formatDateLabel = (sentAt) => new Date(sentAt).toLocaleDateString('id-ID', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const formatDateKey = (sentAt) => {
  const date = new Date(sentAt);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatRoomchatTime = (dateValue) => {
  if (!dateValue) return '-';
  return new Date(dateValue).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export default function SantriScabiesKonsultasiRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingReason, setClosingReason] = useState('');
  const chatContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const forceScrollToLatestRef = useRef(false);

  const fetchData = useCallback(async (isFirstLoad = false) => {
    try {
      const container = chatContainerRef.current;
      const isNearBottom = container
        ? container.scrollHeight - (container.scrollTop + container.clientHeight) < 120
        : true;

      const [detailRes, messageRes] = await Promise.all([
        api.get(`/santri/konsultasi/rooms/${roomId}`),
        api.get(`/santri/konsultasi/rooms/${roomId}/messages`),
      ]);

      setRoom(normalizeRoom(detailRes.data?.data || null));

      const items = (messageRes.data?.data?.messages || []).map(normalizeMessage);
      setMessages(items);

      if (isFirstLoad || isNearBottom) {
        forceScrollToLatestRef.current = true;
      }

    } catch (error) {
      console.error('Gagal memuat room konsultasi:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
  if (!loading && chatContainerRef.current) {
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'auto'
    });
  }
}, [loading]);

  const sendMessage = async () => {
    if (!message.trim() || isSending) return;
    try {
      setIsSending(true);
      await api.post(`/santri/konsultasi/rooms/${roomId}/messages`, { message });
      setMessage('');
      forceScrollToLatestRef.current = true;
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  const closeRoom = async () => {
    if (!closingReason.trim()) return alert('Alasan wajib diisi');
    try {
      await api.post(`/santri/konsultasi/rooms/${roomId}/close`, { reason_text: closingReason });
      setShowCloseModal(false);
      setClosingReason('');
      navigate('/santri/scabies/konsultasi');
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menutup room.');
    }
  };

  const statusBadge = useMemo(() => {
    if (!room) return null;
    if (room.status === 'active') return <span className='px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs'>active</span>;
    if (room.status === 'waiting') return <span className='px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs'>waiting</span>;
    return <span className='px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs'>closed</span>;
  }, [room]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDateKey = '';
    for (const msg of messages) {
      const dateKey = formatDateKey(msg.sent_at);
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        groups.push({ type: 'date', value: formatDateLabel(msg.sent_at), id: `date-${dateKey}` });
      }
      groups.push({ type: 'message', value: msg, id: `msg-${msg.id}` });
    }
    return groups;
  }, [messages]);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    if (!shouldAutoScrollRef.current && !forceScrollToLatestRef.current) return;
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
    forceScrollToLatestRef.current = false;
  }, [messages, roomId]);

  const handleChatScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }, []);

  if (loading) 
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin' />
      </div>
    );

  return (
    <div className='min-h-screen bg-gray-50 pb-8'>
      <div className="bg-[url('../src/assets/header.png')] bg-cover bg-center text-white p-6 pb-20 shadow-lg">
        <div className='max-w-5xl mx-auto flex items-center gap-4'>
          <button onClick={() => navigate('/santri/scabies')} className='flex-shrink-0 p-2 hover:bg-white/20 rounded-full transition'>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className='text-2xl font-bold'>Ruang Percakapan Konsultasi</h1>
            <p className='text-green-100 text-sm'>dengan {room?.timkes?.nama || 'Tim Kesehatan'}</p>
          </div>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 -mt-12'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 h-[79vh] flex flex-col overflow-hidden'>
          <div className='p-4 border-b border-gray-100 flex items-center justify-between'>
            <div>
              <p className='font-semibold text-gray-800'>{room?.timkes?.nama || 'Tim Kesehatan'}</p>
              <div className='mt-1'>{statusBadge}</div>
            </div>
            {room?.status !== 'closed' && (
              <div className='flex items-center gap-2'>
                <button onClick={() => setShowCloseModal(true)} className='px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold'>Konsultasi Selesai</button>
              </div>
            )}
          </div>

           <div ref={chatContainerRef} onScroll={handleChatScroll} className='flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50'>
            {groupedMessages.map((entry) => {
              if (entry.type === 'date') {
                return (
                  <div key={entry.id} className='flex justify-center'>
                    <span className='px-3 py-1 text-[11px] rounded-full bg-gray-200 text-gray-600'>{entry.value}</span>
                  </div>
                );
              }

              const item = entry.value;
              const isMe = item.sender_role === 'santri';
              return (
                <div key={entry.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md'}`}>
                    <p className='whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm'>{item.message_text}</p>
                    <div className={`mt-1 text-[11px] flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400'}`}>
                      {formatRoomchatTime(item.sent_at)}
                      {isMe && (item.read_at ? <CheckCheck size={13} /> : <Check size={13} />)}
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && <div className='text-center text-gray-500 text-sm mt-10'>Belum ada percakapan.</div>}
          </div>

          <div className='p-3 border-t border-gray-100 flex items-center gap-2'>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={room?.status === 'closed' || isSending}
              className='flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 outline-none disabled:bg-gray-100'
              placeholder={room?.status === 'waiting' ? 'Room waiting, tetap bisa kirim pesan...' : 'Tulis pesan...'}
            />
            <button onClick={sendMessage} disabled={room?.status === 'closed' || isSending} className='p-2.5 rounded-xl bg-green-600 text-white disabled:bg-gray-300'>
              <Send size={16} />
            </button>
          </div>

          {room?.status === 'waiting' && <div className='px-4 pb-3 text-xs text-amber-700 flex items-center gap-1'><CircleCheckBig size={14} /> Anda masuk waiting list dan akan aktif otomatis saat slot kosong.</div>}
        </div>
      </div>

      {showCloseModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-2xl p-5 w-full max-w-md'>
            <div className='flex items-center justify-between'>
              <h3 className='font-bold text-gray-800'>Selesaikan Konsultasi</h3>
              <button 
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingReason('');
                }} 
                className='p-2 rounded-lg hover:bg-gray-100'>
                  <X size={16} />
              </button>
            </div>
            <p className='text-sm text-gray-500 mt-1'>Tuliskan alasan konsultasi selesai.</p>
            <textarea value={closingReason} onChange={(e) => setClosingReason(e.target.value)} className='w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm min-h-28 outline-none focus:ring-2 focus:ring-green-200' placeholder='Alasan penutupan...' />
            <div className='mt-4 flex justify-end gap-2'>
              <button 
                onClick={() => {
                  setShowCloseModal(false);
                  setClosingReason('');
                }} 
                className='px-4 py-2 rounded-lg bg-gray-100 text-gray-700'>
                Batal
              </button>
              <button 
                onClick={closeRoom} 
                className='px-4 py-2 rounded-lg bg-red-600 text-white'
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
