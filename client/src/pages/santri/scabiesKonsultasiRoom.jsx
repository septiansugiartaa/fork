import { ArrowLeft, CheckCheck, Send, Check, CircleCheckBig, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

  const fetchData = async () => {
    try {
      const [detailRes, messageRes] = await Promise.all([
        api.get(`/santri/konsultasi/rooms/${roomId}`),
        api.get(`/santri/konsultasi/rooms/${roomId}/messages`),
      ]);
      setRoom(normalizeRoom(detailRes.data?.data || null));
      const items = (messageRes.data?.data?.messages || []).map(normalizeMessage);
      setMessages(items);

      if (items.length > 0) {
        const lastId = items[items.length - 1].id;
        await api.post(`/santri/konsultasi/rooms/${roomId}/read`, { last_read_message_id: lastId });
      }
    } catch (error) {
      console.error('Gagal memuat room konsultasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const sendMessage = async () => {
    if (!message.trim() || isSending) return;
    try {
      setIsSending(true);
      await api.post(`/santri/konsultasi/rooms/${roomId}/messages`, { message });
      setMessage('');
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

      <div className='max-w-5xl mx-auto px-4 -mt-10'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 h-[82vh] flex flex-col overflow-hidden'>
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

          <div className='flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50'>
            {messages.map((item) => {
              const isMe = item.sender_role === 'santri';
              return (
                <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMe ? 'bg-green-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md'}`}>
                    <p className='whitespace-pre-wrap text-sm'>{item.message_text}</p>
                    <div className={`mt-1 text-[11px] flex items-center gap-1 ${isMe ? 'text-green-100 justify-end' : 'text-gray-400'}`}>
                      {new Date(item.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
