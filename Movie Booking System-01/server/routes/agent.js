import express from 'express'
import { requireAuth } from '../middleware/clerkAuth.js'
import { runAgentRecommendation } from '../services/agentService.js'
import User from '../models/User.js'

const router = express.Router()

// POST /api/agent/recommend
router.post('/recommend', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Free tier gating: 5 picks/day
    if (!user.canUseAI()) {
      return res.status(402).json({
        error: 'upgrade_required',
        feature: 'ai_picks',
        message: 'You\'ve used all 5 free AI picks today. Upgrade to CineAI Pro for unlimited picks.'
      })
    }

    const { message, moodParams, isGroupPick, memberIds, isBlindPick } = req.body

    const result = await runAgentRecommendation({
      message,
      userId: req.clerkId,
      moodParams,
      isGroupPick,
      memberIds,
      isBlindPick
    })

    await user.incrementAIPicks()
    res.json(result)
  } catch (err) {
    console.error('Agent error:', err)
    res.status(500).json({ error: 'AI recommendation failed. Please try again.' })
  }
})

// GET /api/agent/usage — check remaining picks today
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const now = new Date()
    const resetAt = user.aiPicksResetAt
    const isNewDay = !resetAt || now.toDateString() !== new Date(resetAt).toDateString()

    res.json({
      plan: user.plan,
      picksUsedToday: isNewDay ? 0 : user.aiPicksToday,
      picksLimit: user.plan === 'pro' ? null : 5,
      unlimited: user.plan === 'pro'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
