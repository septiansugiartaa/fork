const prisma = require('../../config/prisma');

const MAX_ACTIVE_PER_TIMKES = 10;
const AUTO_CLOSE_HOURS = 24;

const getTodayRange = () => {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const normalizeRoom = (room) => ({
  id: room.id_room,
  id_santri: room.id_santri,
  id_timkes: room.id_timkes,
  status: room.status,
  antrian_urutan: room.antrian_urutan ? Number(room.antrian_urutan) : null,
  active_date: room.active_date,
  last_message_at: room.last_message_at,
  closed_at: room.closed_at,
  closed_reason_type: room.close_reason_type,
  closed_reason_text: room.closed_reason_text,
  created_at: room.created_at,
  updated_at: room.updated_at,
  santri: room.santri || null,
  timkes: room.timkes || null,
  unread_count: room.unread_count || 0,
  last_message: room.last_message || null,
});

const normalizeMessage = (message, senderMap = new Map()) => ({
  id: message.id_message,
  id_room: message.id_room,
  id_sender: message.id_sender,
  sender_role: message.sender_role,
  message_text: message.messgae_text,
  sent_at: message.sent_at,
  read_at: message.read_at,
  is_active: message.is_active,
  sender: senderMap.get(message.id_sender) || message.sender || null,
});

const assertParticipant = (room, userId) => {
  if (room.id_santri !== userId && room.id_timkes !== userId) {
    const err = new Error('Anda tidak memiliki akses room ini.');
    err.statusCode = 403;
    throw err;
  }
};

const getTimkesUserRows = async () => prisma.$queryRaw`
  SELECT DISTINCT u.id, u.nama, u.foto_profil
  FROM users u
  INNER JOIN user_role ur ON ur.id_user = u.id AND ur.is_active = true
  INNER JOIN role r ON r.id = ur.id_role
  WHERE u.is_active = true
    AND LOWER(REPLACE(r.role, ' ', '')) = 'timkesehatan'
  ORDER BY u.nama ASC
`;

const attachRoomRelations = async (rooms, viewerId) => {
  if (!rooms.length) return [];

  const roomIds = rooms.map((room) => room.id_room);
  const userIds = [...new Set(rooms.flatMap((room) => [room.id_santri, room.id_timkes]).filter(Boolean))];

  const [users, allMessages, unreadCounts] = await Promise.all([
    prisma.users.findMany({ where: { id: { in: userIds } }, select: { id: true, nama: true, foto_profil: true } }),
    prisma.konsultasi_message.findMany({
      where: { id_room: { in: roomIds }, is_active: true },
      orderBy: [{ id_room: 'asc' }, { sent_at: 'desc' }],
    }),
    prisma.konsultasi_message.groupBy({
      by: ['id_room'],
      where: { id_room: { in: roomIds }, read_at: null, id_sender: { not: viewerId }, is_active: true },
      _count: { _all: true },
    }),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const unreadMap = new Map(unreadCounts.map((item) => [item.id_room, item._count._all]));

  const latestMessageMap = new Map();
  for (const message of allMessages) {
    if (!latestMessageMap.has(message.id_room)) {
      latestMessageMap.set(message.id_room, normalizeMessage(message, userMap));
    }
  }

  return rooms.map((room) => ({
    ...room,
    santri: userMap.get(room.id_santri) || null,
    timkes: userMap.get(room.id_timkes) || null,
    last_message: latestMessageMap.get(room.id_room) || null,
    unread_count: unreadMap.get(room.id_room) || 0,
  }));
};

const getTimkesList = async () => {
  const { start, end } = getTodayRange();
  const timkesUsers = await getTimkesUserRows();

  const activeRooms = await prisma.konsultasi_room.groupBy({
    by: ['id_timkes'],
    where: {
      status: 'active',
      active_date: { gte: start, lt: end },
      id_timkes: { in: timkesUsers.map((u) => Number(u.id)) },
    },
    _count: { _all: true },
  });

  const activeCountMap = new Map(activeRooms.map((item) => [item.id_timkes, item._count._all]));

  return timkesUsers.map((u) => {
    const activeCount = activeCountMap.get(Number(u.id)) || 0;
    return {
      id: Number(u.id),
      nama: u.nama,
      foto_profil: u.foto_profil,
      active_count: activeCount,
      max_slot: MAX_ACTIVE_PER_TIMKES,
      is_full: activeCount >= MAX_ACTIVE_PER_TIMKES,
    };
  });
};

const autoCloseExpiredActiveRooms = async () => {
  const { start } = getTodayRange();
  const rooms = await prisma.konsultasi_room.findMany({
    where: {
      status: 'active',
      OR: [
        { active_date: { lt: start } },
        { active_date: null, created_at: { lt: start } },
      ],
    },
    select: { id_room: true, id_timkes: true },
  });

  for (const room of rooms) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.konsultasi_room.findUnique({ where: { id_room: room.id_room } });
      if (!current || current.status !== 'active') return;

      await tx.konsultasi_room.update({
        where: { id_room: room.id_room },
        data: {
          status: 'closed',
          closed_at: new Date(),
          close_reason_type: 'auto_inactive',
          closed_reason_text: 'Ditutup otomatis karena reset slot harian',
          updated_at: new Date(),
        },
      });

      await promoteWaitingRoom(tx, room.id_timkes);
    });
  }

  return rooms.length;
};

const getCurrentRoomBySantri = async (santriId) => {
  santriId = Number(santriId);

  await autoCloseExpiredActiveRooms();

  const room = await prisma.konsultasi_room.findFirst({
    where: { id_santri: santriId, status: { in: ['active', 'waiting'] } },
    orderBy: { created_at: 'desc' },
  });

  if (!room) return null;

  const [hydrated] = await attachRoomRelations([room], santriId);
  return normalizeRoom(hydrated);
};

const promoteWaitingRoom = async (tx, timkesId) => {
  const { start, end } = getTodayRange();
  const activeCount = await tx.konsultasi_room.count({
    where: { id_timkes: timkesId, status: 'active', active_date: { gte: start, lt: end } },
  });

  if (activeCount >= MAX_ACTIVE_PER_TIMKES) return null;

  const waiting = await tx.konsultasi_room.findFirst({
    where: { id_timkes: timkesId, status: 'waiting' },
    orderBy: [{ antrian_urutan: 'asc' }, { created_at: 'asc' }],
  });

  if (!waiting) return null;

  return tx.konsultasi_room.update({
    where: { id_room: waiting.id_room },
    data: { status: 'active', active_date: new Date(), updated_at: new Date() },
  });
};

const createRoom = async ({ santriId, timkesId }) => {
  const { start, end } = getTodayRange();

  return prisma.$transaction(async (tx) => {
    const hasCurrent = await tx.konsultasi_room.findFirst({
      where: { id_santri: santriId, status: { in: ['active', 'waiting'] } },
      select: { id_room: true },
    });

    if (hasCurrent) {
      const err = new Error('Santri masih memiliki room aktif atau waiting.');
      err.statusCode = 409;
      throw err;
    }

    const timkes = await tx.$queryRaw`
      SELECT DISTINCT u.id
      FROM users u
      INNER JOIN user_role ur ON ur.id_user = u.id AND ur.is_active = true
      INNER JOIN role r ON r.id = ur.id_role
      WHERE u.id = ${timkesId}
        AND u.is_active = true
        AND LOWER(REPLACE(r.role, ' ', '')) = 'timkesehatan'
      LIMIT 1
    `;

    if (!timkes.length) {
      const err = new Error('Tim kesehatan tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    const activeCount = await tx.konsultasi_room.count({
      where: { id_timkes: timkesId, status: 'active', active_date: { gte: start, lt: end } },
    });

    const status = activeCount < MAX_ACTIVE_PER_TIMKES ? 'active' : 'waiting';
    const now = new Date();
    const room = await tx.konsultasi_room.create({
      data: {
        id_santri: santriId,
        id_timkes: timkesId,
        status,
        antrian_urutan: BigInt(Date.now()),
        active_date: status === 'active' ? now : null,
        last_message_at: now,
        created_at: now,
        updated_at: now,
      },
    });

    const [hydrated] = await attachRoomRelations([room], santriId);
    return normalizeRoom(hydrated);
  });
};

const getRoomById = async (roomId, userId) => {
  const room = await prisma.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });

  if (!room) {
    const err = new Error('Room tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  assertParticipant(room, userId);
  const [hydrated] = await attachRoomRelations([room], userId);
  return normalizeRoom(hydrated);
};

const getRoomMessages = async (roomId, userId) => {
  const room = await prisma.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });
  if (!room) {
    const err = new Error('Room tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  assertParticipant(room, userId);

  const messages = await prisma.konsultasi_message.findMany({
    where: { id_room: Number(roomId), is_active: true },
    orderBy: { sent_at: 'asc' },
  });

  const senderIds = [...new Set(messages.map((item) => item.id_sender))];
  const senders = await prisma.users.findMany({ where: { id: { in: senderIds } }, select: { id: true, nama: true, foto_profil: true } });
  const senderMap = new Map(senders.map((item) => [item.id, item]));
  const [hydratedRoom] = await attachRoomRelations([room], userId);

  return { room: normalizeRoom(hydratedRoom), messages: messages.map((item) => normalizeMessage(item, senderMap)) };
};

const sendMessage = async ({ roomId, senderId, senderRole, messageText }) => {
  if (!messageText || !messageText.trim()) {
    const err = new Error('Pesan tidak boleh kosong.');
    err.statusCode = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const room = await tx.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });
    if (!room) {
      const err = new Error('Room tidak ditemukan.');
      err.statusCode = 404;
      throw err;
    }

    assertParticipant(room, senderId);

    if (room.status === 'closed') {
      const err = new Error('Room sudah ditutup.');
      err.statusCode = 409;
      throw err;
    }

    const now = new Date();
    const message = await tx.konsultasi_message.create({
      data: {
        id_room: Number(roomId),
        id_sender: senderId,
        sender_role: senderRole,
        messgae_text: messageText.trim(),
        sent_at: now,
        is_active: true,
      },
    });

    await tx.konsultasi_room.update({
      where: { id_room: Number(roomId) },
      data: { last_message_at: now, updated_at: now },
    });

    const sender = await tx.users.findUnique({ where: { id: senderId }, select: { id: true, nama: true, foto_profil: true } });
    return normalizeMessage({ ...message, sender });
  });
};

const closeRoom = async ({ roomId, userId, userRole, reasonText }) => prisma.$transaction(async (tx) => {
  const room = await tx.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });

  if (!room) {
    const err = new Error('Room tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  assertParticipant(room, userId);

  if (room.status === 'closed') return normalizeRoom(room);

  const closeType = userRole === 'timkesehatan' ? 'manual_timkes' : 'manual_santri';
  if (!reasonText || !reasonText.trim()) {
    const err = new Error('Alasan penutupan wajib diisi.');
    err.statusCode = 400;
    throw err;
  }

  const closedRoom = await tx.konsultasi_room.update({
    where: { id_room: Number(roomId) },
    data: {
      status: 'closed',
      closed_at: new Date(),
      closed_by: userId,
      close_reason_type: closeType,
      closed_reason_text: reasonText?.trim() || null,
      updated_at: new Date(),
    },
  });

  await promoteWaitingRoom(tx, room.id_timkes);

  return normalizeRoom(closedRoom);
});

const listActiveRoomsByTimkes = async (timkesId) => {
  await autoCloseExpiredActiveRooms();
  const { start, end } = getTodayRange();
  
  const rooms = await prisma.konsultasi_room.findMany({
    where: { id_timkes: timkesId, status: 'active', active_date: { gte: start, lt: end } },
    orderBy: { updated_at: 'desc' },
  });

  const hydrated = await attachRoomRelations(rooms, timkesId);
  return hydrated.map((room) => normalizeRoom(room));
};

const listRoomHistory = async ({ userId, userRole }) => {
  const where = userRole === 'santri' ? { id_santri: userId } : { id_timkes: userId };

  const rooms = await prisma.konsultasi_room.findMany({
    where: { ...where, status: 'closed' },
    orderBy: { closed_at: 'desc' },
  });

  const hydrated = await attachRoomRelations(rooms, userId);
  return hydrated.map((room) => normalizeRoom(room));
};

const markRead = async ({ roomId, userId, lastReadMessageId }) => {
  const room = await prisma.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });
  if (!room) {
    const err = new Error('Room tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }
  assertParticipant(room, userId);

  const targetMessage = await prisma.konsultasi_message.findFirst({
    where: { id_message: Number(lastReadMessageId), id_room: Number(roomId) },
    select: { id_message: true },
  });

  if (!targetMessage) {
    const err = new Error('Pesan tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  await prisma.konsultasi_message.updateMany({
    where: {
      id_room: Number(roomId),
      id_message: { lte: targetMessage.id_message },
      id_sender: { not: userId },
      read_at: null,
      is_active: true,
    },
    data: { read_at: new Date() },
  });

  const existingCursor = await prisma.konsultasi_read_cursor.findFirst({
    where: { id_room: Number(roomId), id_user: userId },
    select: { id_read: true },
  });

  if (existingCursor) {
    await prisma.konsultasi_read_cursor.update({
      where: { id_read: existingCursor.id_read },
      data: {
        last_read_message_id: targetMessage.id_message,
        last_read_at: new Date(),
      },
    });
  } else {
    await prisma.konsultasi_read_cursor.create({
      data: {
        id_room: Number(roomId),
        id_user: userId,
        last_read_message_id: targetMessage.id_message,
        last_read_at: new Date(),
      },
    });
  }
};

const autoCloseInactiveRooms = async () => {
  const threshold = new Date(Date.now() - AUTO_CLOSE_HOURS * 60 * 60 * 1000);
  const rooms = await prisma.konsultasi_room.findMany({
    where: { status: 'active', last_message_at: { lte: threshold } },
    select: { id_room: true, id_timkes: true },
  });

  for (const room of rooms) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.konsultasi_room.findUnique({ where: { id_room: room.id_room } });
      if (!current || current.status === 'closed') return;

      await tx.konsultasi_room.update({
        where: { id_room: room.id_room },
        data: {
          status: 'closed',
          closed_at: new Date(),
          close_reason_type: 'auto_inactive',
          closed_reason_text: 'Ditutup otomatis karena tidak ada respons 24 jam',
          updated_at: new Date(),
        },
      });

      await promoteWaitingRoom(tx, room.id_timkes);
    });
  }

  return rooms.length;
};

const getRoomHealthSummary = async ({ roomId, userId }) => {
  const room = await prisma.konsultasi_room.findUnique({ where: { id_room: Number(roomId) } });
  if (!room) {
    const err = new Error('Room tidak ditemukan.');
    err.statusCode = 404;
    throw err;
  }

  assertParticipant(room, userId);

  const [santri, screening, observasi] = await Promise.all([
    prisma.users.findUnique({
      where: { id: room.id_santri },
      select: {
        id: true,
        nama: true,
        nip: true,
        foto_profil: true,
        is_active: true,
        kelas_santri: {
          where: { is_active: true },
          orderBy: { id: 'desc' },
          take: 1,
          select: { kelas: { select: { kelas: true } } },
        },
        kamar_santri: {
          where: { is_active: true },
          orderBy: { tanggal_masuk: 'desc' },
          take: 1,
          select: { kamar: { select: { kamar: true } } },
        },
      },
    }),
    prisma.screening.findMany({
      where: { id_santri: room.id_santri, is_active: true },
      orderBy: { tanggal: 'desc' },
      take: 2,
      select: {
        id_screening: true,
        tanggal: true,
        total_skor: true,
        status: true,
        diagnosa: true,
        users_screening_id_timkesTousers: {
          select: { nama: true },
        },
      },
    }),
    prisma.observasi.findMany({
      where: { id_santri: room.id_santri, is_active: true },
      orderBy: { tanggal: 'desc' },
      take: 2,
      select: {
        id_observasi: true,
        tanggal: true,
        waktu: true,
        skor_diperoleh: true,
        users_observasi_id_timkesTousers: {
          select: { nama: true },
        },
      },
    }),
  ]);

  return {
    santri: santri
      ? {
          id: santri.id,
          nama: santri.nama,
          nip: santri.nip,
          foto_profil: santri.foto_profil,
          kelas: santri.kelas_santri?.[0]?.kelas?.kelas || '-',
          kamar: santri.kamar_santri?.[0]?.kamar?.kamar || '-',
          status: santri.is_active ? 'Aktif' : 'Tidak Aktif',
        }
      : null,
    screening: screening.map((item) => ({
      id_screening: item.id_screening,
      tanggal: item.tanggal,
      total_skor: item.total_skor,
      status: item.status,
      diagnosa: item.diagnosa,
      pemeriksa: item.users_screening_id_timkesTousers?.nama || '-',
    })),
    observasi: observasi.map((item) => ({
      id_observasi: item.id_observasi,
      tanggal: item.tanggal,
      waktu: item.waktu,
      skor_diperoleh: item.skor_diperoleh,
      pemeriksa: item.users_observasi_id_timkesTousers?.nama || '-',
    })),
  };
};

module.exports = {
  getTimkesList,
  getCurrentRoomBySantri,
  createRoom,
  getRoomById,
  getRoomMessages,
  sendMessage,
  closeRoom,
  listActiveRoomsByTimkes,
  listRoomHistory,
  markRead,
  autoCloseInactiveRooms,
  autoCloseExpiredActiveRooms,
  getRoomHealthSummary,
};
