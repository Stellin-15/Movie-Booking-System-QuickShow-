import express from 'express'
import LibraryItem from '../models/LibraryItem.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/clerkAuth.js'
import { checkBadges } from '../services/preferenceService.js'

const router = express.Router()

// All library routes require auth
router.use(requireAuth)

// GET /api/library — get user's full library
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const filter = { clerkId: req.clerkId }
    if (status) filter.status = status
    const items = await LibraryItem.find(filter).sort({ addedAt: -1 })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/library — add movie to library
router.post('/', async (req, res) => {
  try {
    const { tmdbId, title, posterPath, backdropPath, releaseYear, genres, runtime, status, userRating, notes } = req.body

    // Check free tier library limit (500 items)
    const user = await User.findOne({ clerkId: req.clerkId })
    if (user?.plan === 'free') {
      const count = await LibraryItem.countDocuments({ clerkId: req.clerkId })
      if (count >= 500) {
        return res.status(402).json({ error: 'upgrade_required', feature: 'library_limit', message: 'Free tier limited to 500 movies. Upgrade to Pro for unlimited.' })
      }
    }

    const item = await LibraryItem.findOneAndUpdate(
      { clerkId: req.clerkId, tmdbId },
      { clerkId: req.clerkId, tmdbId, title, posterPath, backdropPath, releaseYear, genres, runtime, status, userRating, notes, watchedAt: status === 'watched' ? new Date() : undefined },
      { upsert: true, new: true }
    )

    // Update user totals + check badges
    if (status === 'watched') {
      await User.findOneAndUpdate({ clerkId: req.clerkId }, { $inc: { totalWatched: 1 } })
    }

    const freshUser = await User.findOne({ clerkId: req.clerkId })
    const newBadges = await checkBadges(req.clerkId, freshUser)
    if (newBadges.length > 0) {
      freshUser.badges = [...new Set([...freshUser.badges, ...newBadges])]
      await freshUser.save()
    }

    res.status(201).json({ item, newBadges })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/library/:tmdbId — update status or rating
router.put('/:tmdbId', async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId)
    const allowed = ['status', 'userRating', 'notes', 'watchedAt', 'rewatchCount']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    const item = await LibraryItem.findOneAndUpdate({ clerkId: req.clerkId, tmdbId }, updates, { new: true })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/library/:tmdbId
router.delete('/:tmdbId', async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId)
    await LibraryItem.findOneAndDelete({ clerkId: req.clerkId, tmdbId })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/library/stats — taste stats for profile page
router.get('/stats', async (req, res) => {
  try {
    const items = await LibraryItem.find({ clerkId: req.clerkId, status: { $in: ['watched', 'rewatching'] } })
    const genreMap = {}
    let totalRuntime = 0
    for (const item of items) {
      totalRuntime += item.runtime || 0
      for (const g of item.genres || []) genreMap[g] = (genreMap[g] || 0) + 1
    }
    res.json({
      totalWatched: items.length,
      totalHours: Math.round(totalRuntime / 60),
      genres: Object.entries(genreMap).sort((a, b) => b[1] - a[1])
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
