import express from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/clerkAuth.js'
import { computeCompatibility } from '../services/preferenceService.js'

const router = express.Router()

// POST /api/users/sync — create or update user on first sign-in
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { email, name, avatar, username } = req.body
    let user = await User.findOne({ clerkId: req.clerkId })
    if (!user) {
      // Generate unique username from name if not provided
      let baseUsername = username || name?.toLowerCase().replace(/\s+/g, '') || 'user'
      let finalUsername = baseUsername
      let suffix = 1
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${suffix++}`
      }
      user = await User.create({ clerkId: req.clerkId, email, name, avatar, username: finalUsername })
    } else {
      if (name) user.name = name
      if (avatar) user.avatar = avatar
      await user.save()
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/users/me — update profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const allowed = ['bio', 'username', 'topFourFilms', 'preferences']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    const user = await User.findOneAndUpdate({ clerkId: req.clerkId }, updates, { new: true })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, '-stripeCustomerId -stripeSubscriptionId -aiPicksToday -aiPicksResetAt')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/:username/compatibility — taste match score
router.get('/:username/compatibility', requireAuth, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username })
    if (!other) return res.status(404).json({ error: 'User not found' })
    const score = await computeCompatibility(req.clerkId, other.clerkId)
    res.json({ score })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/users/me/wrapped — get annual wrapped data
router.get('/me/wrapped', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId }, 'wrapped')
    res.json(user?.wrapped || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
