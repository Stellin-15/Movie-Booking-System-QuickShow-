import axios from 'axios'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: API_KEY }
})

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
export const posterUrl = (path, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
export const backdropUrl = (path, size = 'w1280') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null

export async function getTrending(timeWindow = 'week') {
  const { data } = await tmdb.get(`/trending/movie/${timeWindow}`)
  return data.results
}

export async function getPopular(page = 1) {
  const { data } = await tmdb.get('/movie/popular', { params: { page } })
  return data
}

export async function searchMovies({ query, genre, yearFrom, yearTo, minRating, language, page = 1 }) {
  if (query) {
    const { data } = await tmdb.get('/search/movie', { params: { query, page } })
    return data
  }
  // Discover mode
  const params = { page, sort_by: 'popularity.desc' }
  if (genre) params.with_genres = genre
  if (yearFrom) params['primary_release_date.gte'] = `${yearFrom}-01-01`
  if (yearTo) params['primary_release_date.lte'] = `${yearTo}-12-31`
  if (minRating) params['vote_average.gte'] = minRating
  if (language) params.with_original_language = language
  const { data } = await tmdb.get('/discover/movie', { params })
  return data
}

export async function getMovieDetails(tmdbId) {
  const [details, credits, videos, externalIds, similar] = await Promise.all([
    tmdb.get(`/movie/${tmdbId}`),
    tmdb.get(`/movie/${tmdbId}/credits`),
    tmdb.get(`/movie/${tmdbId}/videos`),
    tmdb.get(`/movie/${tmdbId}/external_ids`),
    tmdb.get(`/movie/${tmdbId}/similar`)
  ])
  return {
    ...details.data,
    cast: credits.data.cast.slice(0, 10),
    crew: credits.data.crew.filter(c => ['Director', 'Writer', 'Screenplay'].includes(c.job)).slice(0, 5),
    trailerKey: videos.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
    imdbId: externalIds.data.imdb_id,
    similar: similar.data.results.slice(0, 8)
  }
}

export async function getSimilarMovies(tmdbId) {
  const { data } = await tmdb.get(`/movie/${tmdbId}/similar`)
  return data.results
}

export async function getGenres() {
  const { data } = await tmdb.get('/genre/movie/list')
  return data.genres
}

export async function getMoviesByIds(ids) {
  const results = await Promise.allSettled(
    ids.map(id => tmdb.get(`/movie/${id}`).then(r => r.data))
  )
  return results.filter(r => r.status === 'fulfilled').map(r => r.value)
}
