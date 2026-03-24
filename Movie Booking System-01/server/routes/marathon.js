import express from 'express'
import MarathonRoom from '../models/MarathonRoom.js'
import { requireAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// POST /api/marathon — create room
router.post('/', requireAuth, async (req, res) => {
  try {
    let roomCode
    let attempts = 0
    do {
      roomCode = generateCode()
      attempts++
    } while (await MarathonRoom.findOne({ roomCode }) && attempts < 10)

    const room = await MarathonRoom.create({ roomCode, hostId: req.clerkId, members: [req.clerkId] })
    res.status(201).json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/marathon/join — join via code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { roomCode } = req.body
    const room = await MarathonRoom.findOne({ roomCode: roomCode.toUpperCase() })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    if (room.status === 'done') return res.status(400).json({ error: 'This marathon has ended' })
    if (!room.members.includes(req.clerkId)) {
      room.members.push(req.clerkId)
      await room.save()
    }
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/marathon/:roomCode
router.get('/:roomCode', requireAuth, async (req, res) => {
  try {
    const room = await MarathonRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/marathon/:roomCode/nominate — add movie candidate
router.post('/:roomCode/nominate', requireAuth, async (req, res) => {
  try {
    const room = await MarathonRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    if (!room || !room.members.includes(req.clerkId)) return res.status(403).json({ error: 'Not a member' })
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Voting already started' })

    const { tmdbId, title, posterPath } = req.body
    const exists = room.candidateMovies.find(m => m.tmdbId === tmdbId)
    if (exists) return res.status(409).json({ error: 'Movie already nominated' })

    room.candidateMovies.push({ tmdbId, title, posterPath, addedBy: req.clerkId })
    await room.save()
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/marathon/:roomCode/vote/:tmdbId
router.post('/:roomCode/vote/:tmdbId', requireAuth, async (req, res) => {
  try {
    const room = await MarathonRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    if (!room || !room.members.includes(req.clerkId)) return res.status(403).json({ error: 'Not a member' })
    if (room.status !== 'voting') return res.status(400).json({ error: 'Not in voting phase' })

    const tmdbId = parseInt(req.params.tmdbId)
    const movie = room.candidateMovies.find(m => m.tmdbId === tmdbId)
    if (!movie) return res.status(404).json({ error: 'Movie not in candidates' })

    // Remove vote from other movies (one vote per user)
    for (const candidate of room.candidateMovies) {
      candidate.votes = candidate.votes.filter(id => id !== req.clerkId)
    }
    movie.votes.push(req.clerkId)
    await room.save()
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/marathon/:roomCode/start-voting — host starts voting
router.post('/:roomCode/start-voting', requireAuth, async (req, res) => {
  try {
    const room = await MarathonRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    if (!room || room.hostId !== req.clerkId) return res.status(403).json({ error: 'Host only' })
    room.status = 'voting'
    await room.save()
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/marathon/:roomCode/reveal — tally votes and reveal winner
router.post('/:roomCode/reveal', requireAuth, async (req, res) => {
  try {
    const room = await MarathonRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    if (!room || room.hostId !== req.clerkId) return res.status(403).json({ error: 'Host only' })
    const winner = room.candidateMovies.sort((a, b) => b.votes.length - a.votes.length)[0]
    room.chosenMovieTmdbId = winner?.tmdbId
    room.status = 'watching'
    await room.save()
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
