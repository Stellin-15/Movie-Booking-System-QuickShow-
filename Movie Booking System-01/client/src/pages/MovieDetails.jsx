import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Star, Clock, Calendar, Globe, Play, BookmarkPlus, ChevronDown, ExternalLink, Users } from 'lucide-react'
import { getMovieDetails } from '../api/movies'
import useLibraryStore from '../stores/useLibraryStore'
import StatusBadge from '../components/ui/StatusBadge'
import StarRating from '../components/ui/StarRating'
import ReviewCard from '../components/social/ReviewCard'
import { apiFetch } from '../api/http'

const TMDB_IMG = 'https://image.tmdb.org/t/p'

export default function MovieDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const addItem = useLibraryStore(s => s.addItem)
  const updateItem = useLibraryStore(s => s.updateItem)
  const getStatus = useLibraryStore(s => s.getStatus)
  const getRating = useLibraryStore(s => s.getRating)
  const status = getStatus(parseInt(id))
  const userRating = getRating(parseInt(id))

  useEffect(() => {
    setLoading(true)
    getMovieDetails(id).then(data => { setMovie(data); setLoading(false) }).catch(() => setLoading(false))
    apiFetch(`/api/reviews/movie/${id}`).then(setReviews).catch(() => {})
  }, [id])

  const handleAddToLibrary = async (newStatus) => {
    if (!isSignedIn) return
    setShowStatusMenu(false)
    await addItem(getToken, {
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      releaseYear: movie.release_date ? parseInt(movie.release_date) : null,
      genres: movie.genres?.map(g => g.name) || [],
      runtime: movie.runtime || null
    }, newStatus)
  }

  const handleRating = async (rating) => {
    if (!isSignedIn || !status) return
    await updateItem(getToken, movie.id, { userRating: rating })
  }

  const submitReview = async () => {
    if (!isSignedIn || !reviewText.trim()) return
    setSubmitting(true)
    try {
      const review = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ tmdbId: movie.id, movieTitle: movie.title, posterPath: movie.poster_path, rating: reviewRating || undefined, body: reviewText })
      }, getToken)
      setReviews(prev => [review, ...prev])
      setReviewText('')
      setReviewRating(0)
    } catch { }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen flex items-center justify-center text-white/40">Movie not found</div>
  )

  const backdropUrl = movie.backdrop_path ? `${TMDB_IMG}/original${movie.backdrop_path}` : null
  const posterUrl = movie.poster_path ? `${TMDB_IMG}/w500${movie.poster_path}` : null

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="relative h-[50vh] bg-cover bg-center" style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 md:px-16 lg:px-24 -mt-32 relative z-10">
        <div className="flex gap-8 flex-col md:flex-row">
          {/* Poster */}
          {posterUrl && (
            <img src={posterUrl} alt={movie.title} className="w-48 h-72 object-cover rounded-2xl shadow-2xl flex-shrink-0 hidden md:block border border-white/10" />
          )}

          {/* Info */}
          <div className="flex-1 pt-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{movie.title}</h1>
            {movie.tagline && <p className="text-white/40 italic mb-4">"{movie.tagline}"</p>}

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-5">
              {movie.release_date && (
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{movie.release_date.slice(0, 4)}</div>
              )}
              {movie.runtime > 0 && (
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</div>
              )}
              {movie.original_language && (
                <div className="flex items-center gap-1.5 uppercase"><Globe className="w-4 h-4" />{movie.original_language}</div>
              )}
            </div>

            {/* Ratings */}
            <div className="flex flex-wrap gap-6 mb-6">
              {movie.vote_average > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-white/30 uppercase tracking-wider">TMDB</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-bold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-xs text-white/30">/ 10</span>
                  </div>
                </div>
              )}
              {movie.imdb?.imdbRating && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-white/30 uppercase tracking-wider">IMDB</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-bold">{movie.imdb.imdbRating}</span>
                    <span className="text-xs text-white/30">/ 10</span>
                  </div>
                </div>
              )}
              {movie.imdb?.rottenTomatoes && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-white/30 uppercase tracking-wider">Rotten Tomatoes</p>
                  <span className="text-xl font-bold">{movie.imdb.rottenTomatoes}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres?.map(g => (
                <span key={g.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{g.name}</span>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {movie.trailerKey && (
                <a href={`https://www.youtube.com/watch?v=${movie.trailerKey}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-full text-sm font-semibold transition-all">
                  <Play className="w-4 h-4 fill-white" /> Watch Trailer
                </a>
              )}

              {/* Library status button */}
              <div className="relative">
                <button onClick={() => isSignedIn ? setShowStatusMenu(o => !o) : null}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full text-sm font-semibold transition-all">
                  <BookmarkPlus className="w-4 h-4" />
                  {status ? <StatusBadge status={status} /> : 'Add to Library'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusMenu && (
                  <div className="absolute left-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-30 w-44 py-2 overflow-hidden">
                    {['watched', 'watchlist', 'watching', 'rewatching', 'dropped'].map(s => (
                      <button key={s} onClick={() => handleAddToLibrary(s)}
                        className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 capitalize transition-colors">
                        <StatusBadge status={s} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Personal rating (if in library) */}
            {status && isSignedIn && (
              <div className="mb-6">
                <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Your Rating</p>
                <StarRating value={userRating || 0} onChange={handleRating} size="lg" />
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        <div className="mt-10 max-w-3xl">
          <h2 className="text-lg font-semibold mb-3">Overview</h2>
          <p className="text-white/60 leading-relaxed">{movie.overview}</p>
        </div>

        {/* Cast */}
        {movie.cast?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
              {movie.cast.map(member => (
                <div key={member.id} className="flex-shrink-0 w-24 text-center">
                  {member.profile_path ? (
                    <img src={`${TMDB_IMG}/w185${member.profile_path}`} alt={member.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-2 border border-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-2 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  <p className="text-xs font-medium truncate">{member.name}</p>
                  <p className="text-xs text-white/40 truncate">{member.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IMDB awards */}
        {movie.imdb?.awards && (
          <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl max-w-lg">
            <p className="text-xs text-yellow-400 font-medium mb-1">Awards</p>
            <p className="text-sm text-white/60">{movie.imdb.awards}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-14">
          <h2 className="text-xl font-bold mb-6">Reviews</h2>

          {/* Write review */}
          {isSignedIn && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-8">
              <p className="text-sm font-medium mb-3">Write a Review</p>
              <StarRating value={reviewRating} onChange={setReviewRating} size="md" />
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/40 resize-none"
                rows={4}
              />
              <button onClick={submitReview} disabled={submitting || !reviewText.trim()}
                className="mt-3 px-5 py-2 bg-primary hover:bg-primary-dull disabled:opacity-40 rounded-full text-sm font-semibold transition-all">
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-white/30 text-sm">No reviews yet. Be the first!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map(r => <ReviewCard key={r._id} review={r} getToken={getToken} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
