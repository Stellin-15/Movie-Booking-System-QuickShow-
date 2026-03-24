import { apiFetch } from './http.js'

export const getTrending = (window = 'week') => apiFetch(`/api/movies/trending?window=${window}`)
export const getPopular = (page = 1) => apiFetch(`/api/movies/popular?page=${page}`)
export const getGenres = () => apiFetch('/api/movies/genres')
export const getMovieDetails = (tmdbId) => apiFetch(`/api/movies/${tmdbId}`)
export const searchMovies = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString()
  return apiFetch(`/api/movies/search?${qs}`)
}
