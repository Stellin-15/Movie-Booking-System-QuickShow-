import express from 'express'
import { getMovieNews, getTrailerNews } from '../services/newsService.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { page = 1, type } = req.query
    const articles = type === 'trailers' ? await getTrailerNews() : await getMovieNews(parseInt(page))
    res.json(articles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
