import express from 'express'
import Review from '../models/Review.js'
import { requireAuth, optionalAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

// GET /api/reviews/movie/:tmdbId — all reviews for a movie
router.get('/movie/:tmdbId', optionalAuth, async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId)
    const reviews = await Review.find({ tmdbId }).sort({ createdAt: -1 }).limit(50)
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reviews/user/:clerkId — reviews by a user
router.get('/user/:clerkId', async (req, res) => {
  try {
    const reviews = await Review.find({ clerkId: req.params.clerkId }).sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reviews — create a review
router.post('/', requireAuth, async (req, res) => {
  try {
    const { tmdbId, movieTitle, posterPath, rating, body, isMicroReview, containsSpoilers, tags, isRewatch } = req.body
    const review = await Review.create({
      clerkId: req.clerkId, tmdbId, movieTitle, posterPath,
      rating, body, isMicroReview, containsSpoilers, tags, isRewatch
    })
    res.status(201).json(review)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reviews/:id/like — toggle like
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ error: 'Review not found' })
    const idx = review.likes.indexOf(req.clerkId)
    if (idx === -1) review.likes.push(req.clerkId)
    else review.likes.splice(idx, 1)
    await review.save()
    res.json({ liked: idx === -1, likeCount: review.likes.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/reviews/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, clerkId: req.clerkId })
    if (!review) return res.status(404).json({ error: 'Review not found or unauthorized' })
    await review.deleteOne()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
