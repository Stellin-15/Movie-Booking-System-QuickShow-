import MarathonRoom from '../models/MarathonRoom.js'

export function initMarathonSocket(io) {
  const marathonNS = io.of('/marathon')

  marathonNS.on('connection', (socket) => {
    // Join a room
    socket.on('join_room', async ({ roomCode, clerkId, username }) => {
      socket.join(roomCode)
      socket.data.clerkId = clerkId
      socket.data.roomCode = roomCode
      socket.data.username = username

      marathonNS.to(roomCode).emit('user_joined', { clerkId, username, timestamp: new Date() })

      // Send current room state
      try {
        const room = await MarathonRoom.findOne({ roomCode })
        if (room) socket.emit('room_state', room)
      } catch { /* ignore */ }
    })

    // Chat message
    socket.on('chat_message', ({ message }) => {
      const { roomCode, clerkId, username } = socket.data
      if (!roomCode || !message?.trim()) return
      marathonNS.to(roomCode).emit('chat_message', {
        clerkId,
        username,
        message: message.trim().slice(0, 500),
        timestamp: new Date()
      })
    })

    // Nominate a movie — also updates room state for all members
    socket.on('movie_nominated', async ({ roomCode, movie }) => {
      marathonNS.to(roomCode).emit('movie_nominated', { movie, by: socket.data.username })
      try {
        const room = await MarathonRoom.findOne({ roomCode })
        if (room) marathonNS.to(roomCode).emit('room_state', room)
      } catch { /* ignore */ }
    })

    // Vote cast
    socket.on('vote_cast', async ({ roomCode }) => {
      try {
        const room = await MarathonRoom.findOne({ roomCode })
        if (room) marathonNS.to(roomCode).emit('room_state', room)
      } catch { /* ignore */ }
    })

    // Winner revealed
    socket.on('winner_revealed', ({ roomCode, movie }) => {
      marathonNS.to(roomCode).emit('winner_revealed', { movie })
    })

    // Now watching — sync timer
    socket.on('start_timer', ({ roomCode, countdownSeconds }) => {
      marathonNS.to(roomCode).emit('start_timer', { countdownSeconds, startedAt: new Date() })
    })

    // Reaction emoji
    socket.on('reaction', ({ roomCode, emoji }) => {
      marathonNS.to(roomCode).emit('reaction', { clerkId: socket.data.clerkId, username: socket.data.username, emoji })
    })

    socket.on('disconnect', () => {
      const { roomCode, clerkId, username } = socket.data
      if (roomCode) marathonNS.to(roomCode).emit('user_left', { clerkId, username })
    })
  })
}
