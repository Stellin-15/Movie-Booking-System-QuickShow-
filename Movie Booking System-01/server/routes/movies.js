import express from 'express'
import { getTrending, getPopular, searchMovies, getMovieDetails, getGenres } from '../services/tmdbService.js'
import { getImdbData } from '../services/omdbService.js'
import { optionalAuth } from '../middleware/clerkAuth.js'

const router = express.Router()

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const { window = 'week' } = req.query
    const results = await getTrending(window)
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/movies/popular
router.get('/popular', async (req, res) => {
  try {
    const { page = 1 } = req.query
    const data = await getPopular(parseInt(page))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/movies/search
router.get('/search', async (req, res) => {
  try {
    const { query, genre, yearFrom, yearTo, minRating, language, page = 1 } = req.query
    const data = await searchMovies({
      query, genre, language, page: parseInt(page),
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined
    })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/movies/genres
router.get('/genres', async (req, res) => {
  try {
    const genres = await getGenres()
    res.json(genres)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/movies/:id — full details with IMDB rating
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tmdbId = parseInt(req.params.id)
    const details = await getMovieDetails(tmdbId)
    const imdb = details.imdbId ? await getImdbData(details.imdbId) : null
    res.json({ ...details, imdb })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
