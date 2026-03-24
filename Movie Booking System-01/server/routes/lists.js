import express from 'express'
import CineList from '../models/CineList.js'
import User from '../models/User.js'
import { requireAuth, optionalAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

// GET /api/lists — browse public lists
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, featured } = req.query
    const filter = { isPublic: true }
    if (featured) filter.isSponsored = true
    const lists = await CineList.find(filter)
      .sort({ saveCount: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
    res.json(lists)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/lists/mine — auth user's lists
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const lists = await CineList.find({
      $or: [{ ownerId: req.clerkId }, { collaborators: req.clerkId }]
    }).sort({ updatedAt: -1 })
    res.json(lists)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/lists/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const list = await CineList.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    if (!list.isPublic && list.ownerId !== req.clerkId && !list.collaborators.includes(req.clerkId)) {
      return res.status(403).json({ error: 'Private list' })
    }
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists — create new list
router.post('/', requireAuth, async (req, res) => {
  try {
    // Free tier: max 3 lists
    const user = await User.findOne({ clerkId: req.clerkId })
    if (user?.plan === 'free') {
      const count = await CineList.countDocuments({ ownerId: req.clerkId })
      if (count >= 3) {
        return res.status(402).json({ error: 'upgrade_required', feature: 'cinelists', message: 'Free tier limited to 3 CineLists. Upgrade to Pro for unlimited.' })
      }
    }

    const { title, description, isPublic, isRanked, isChallengeList } = req.body
    const list = await CineList.create({ ownerId: req.clerkId, title, description, isPublic, isRanked, isChallengeList })
    res.status(201).json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists/:id/movies — add movie to list
router.post('/:id/movies', requireAuth, async (req, res) => {
  try {
    const list = await CineList.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    if (list.ownerId !== req.clerkId && !list.collaborators.includes(req.clerkId)) {
      return res.status(403).json({ error: 'Not authorized to edit this list' })
    }

    const { tmdbId, title, posterPath, note } = req.body
    const exists = list.movies.find(m => m.tmdbId === tmdbId)
    if (exists) return res.status(409).json({ error: 'Movie already in list' })

    list.movies.push({ tmdbId, title, posterPath, note, addedBy: req.clerkId, rank: list.movies.length + 1 })
    await list.save()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/lists/:id/movies/:tmdbId
router.delete('/:id/movies/:tmdbId', requireAuth, async (req, res) => {
  try {
    const list = await CineList.findById(req.params.id)
    if (!list || list.ownerId !== req.clerkId) return res.status(403).json({ error: 'Not authorized' })
    list.movies = list.movies.filter(m => m.tmdbId !== parseInt(req.params.tmdbId))
    await list.save()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists/:id/fork — fork a list
router.post('/:id/fork', requireAuth, async (req, res) => {
  try {
    const original = await CineList.findById(req.params.id)
    if (!original || !original.isPublic) return res.status(404).json({ error: 'List not found' })

    const fork = await CineList.create({
      ownerId: req.clerkId,
      title: `${original.title} (forked)`,
      description: original.description,
      movies: original.movies,
      isPublic: false,
      isRanked: original.isRanked,
      forkedFrom: original._id
    })

    original.forkCount += 1
    await original.save()
    res.status(201).json(fork)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists/:id/save — save/unsave a list
router.post('/:id/save', requireAuth, async (req, res) => {
  try {
    const list = await CineList.findById(req.params.id)
    if (!list) return res.status(404).json({ error: 'List not found' })
    const idx = list.savedBy.indexOf(req.clerkId)
    if (idx === -1) { list.savedBy.push(req.clerkId); list.saveCount += 1 }
    else { list.savedBy.splice(idx, 1); list.saveCount = Math.max(0, list.saveCount - 1) }
    await list.save()
    res.json({ saved: idx === -1, saveCount: list.saveCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/lists/:id/collaborators — invite collaborator
router.post('/:id/collaborators', requireAuth, async (req, res) => {
  try {
    const list = await CineList.findById(req.params.id)
    if (!list || list.ownerId !== req.clerkId) return res.status(403).json({ error: 'Not authorized' })
    const { clerkId } = req.body
    if (!list.collaborators.includes(clerkId)) list.collaborators.push(clerkId)
    await list.save()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/lists/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await CineList.findOneAndDelete({ _id: req.params.id, ownerId: req.clerkId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
