import express from 'express'
import Follow from '../models/Follow.js'
import User from '../models/User.js'
import LibraryItem from '../models/LibraryItem.js'
import Review from '../models/Review.js'
import CineList from '../models/CineList.js'
import { requireAuth } from '../middleware/clerkAuth.js'
import { buildTasteProfile } from '../services/preferenceService.js'

const router = express.Router()

// POST /api/social/follow/:clerkId — follow a user
router.post('/follow/:clerkId', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.clerkId
    if (targetId === req.clerkId) return res.status(400).json({ error: 'Cannot follow yourself' })

    const existing = await Follow.findOne({ followerId: req.clerkId, followingId: targetId })
    if (existing) {
      await existing.deleteOne()
      return res.json({ following: false })
    }
    await Follow.create({ followerId: req.clerkId, followingId: targetId })

    // Check social butterfly badge
    const followerCount = await Follow.countDocuments({ followingId: targetId })
    if (followerCount >= 10) {
      const user = await User.findOne({ clerkId: targetId })
      if (user && !user.badges.includes('social_butterfly')) {
        user.badges.push('social_butterfly')
        await user.save()
      }
    }
    res.json({ following: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/social/followers/:clerkId
router.get('/followers/:clerkId', async (req, res) => {
  try {
    const follows = await Follow.find({ followingId: req.params.clerkId })
    const userIds = follows.map(f => f.followerId)
    const users = await User.find({ clerkId: { $in: userIds } }, 'clerkId name username avatar badges totalWatched')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/social/following/:clerkId
router.get('/following/:clerkId', async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.params.clerkId })
    const userIds = follows.map(f => f.followingId)
    const users = await User.find({ clerkId: { $in: userIds } }, 'clerkId name username avatar badges totalWatched')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/social/feed — activity feed from people you follow
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const follows = await Follow.find({ followerId: req.clerkId })
    const followingIds = follows.map(f => f.followingId)

    if (followingIds.length === 0) return res.json([])

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days

    const [recentWatched, recentReviews, recentLists] = await Promise.all([
      LibraryItem.find({ clerkId: { $in: followingIds }, status: 'watched', watchedAt: { $gte: since } })
        .sort({ watchedAt: -1 }).limit(30),
      Review.find({ clerkId: { $in: followingIds }, createdAt: { $gte: since } })
        .sort({ createdAt: -1 }).limit(30),
      CineList.find({ ownerId: { $in: followingIds }, isPublic: true, createdAt: { $gte: since } })
        .sort({ createdAt: -1 }).limit(10)
    ])

    // Get user info for display
    const allIds = [...new Set([...recentWatched.map(i => i.clerkId), ...recentReviews.map(r => r.clerkId), ...recentLists.map(l => l.ownerId)])]
    const users = await User.find({ clerkId: { $in: allIds } }, 'clerkId name username avatar')
    const userMap = Object.fromEntries(users.map(u => [u.clerkId, u]))

    const feed = [
      ...recentWatched.map(item => ({
        type: 'watched',
        user: userMap[item.clerkId],
        tmdbId: item.tmdbId,
        title: item.title,
        posterPath: item.posterPath,
        rating: item.userRating,
        timestamp: item.watchedAt
      })),
      ...recentReviews.map(r => ({
        type: 'review',
        user: userMap[r.clerkId],
        tmdbId: r.tmdbId,
        title: r.movieTitle,
        posterPath: r.posterPath,
        rating: r.rating,
        body: r.body?.slice(0, 200),
        tags: r.tags,
        timestamp: r.createdAt
      })),
      ...recentLists.map(l => ({
        type: 'list',
        user: userMap[l.ownerId],
        listId: l._id,
        title: l.title,
        movieCount: l.movies.length,
        timestamp: l.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit))

    res.json(feed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/social/suggestions — friend suggestions based on taste
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const myProfile = await buildTasteProfile(req.clerkId)
    const following = await Follow.find({ followerId: req.clerkId })
    const followingIds = new Set(following.map(f => f.followingId))
    followingIds.add(req.clerkId)

    // Find users with similar top genres
    const candidates = await User.find(
      { clerkId: { $nin: [...followingIds] }, 'preferences.favoriteGenres': { $in: myProfile.topGenres } },
      'clerkId name username avatar totalWatched badges'
    ).limit(10)

    res.json(candidates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/social/is-following/:clerkId
router.get('/is-following/:clerkId', requireAuth, async (req, res) => {
  try {
    const follow = await Follow.findOne({ followerId: req.clerkId, followingId: req.params.clerkId })
    res.json({ following: !!follow })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
