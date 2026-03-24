import React, { useState } from 'react'
import { Heart, Flag, AlertTriangle } from 'lucide-react'
import StarRating from '../ui/StarRating'
import { apiFetch } from '../../api/http'
import { useNavigate } from 'react-router-dom'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92'

export default function ReviewCard({ review, getToken, showMovie = false }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(review.likes?.length || 0)
  const [showSpoiler, setShowSpoiler] = useState(false)
  const navigate = useNavigate()

  const toggleLike = async () => {
    if (!getToken) return
    try {
      const res = await apiFetch(`/api/reviews/${review._id}/like`, { method: 'POST' }, getToken)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch { }
  }

  const date = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        {showMovie && review.posterPath && (
          <img
            src={`${TMDB_IMG}${review.posterPath}`}
            alt={review.movieTitle}
            onClick={() => navigate(`/movies/${review.tmdbId}`)}
            className="w-12 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              {showMovie && <p className="text-sm font-semibold text-white/90 cursor-pointer hover:text-primary transition" onClick={() => navigate(`/movies/${review.tmdbId}`)}>{review.movieTitle}</p>}
              {review.rating && <StarRating value={review.rating} readOnly size="sm" />}
            </div>
            <span className="text-xs text-white/30 flex-shrink-0">{date}</span>
          </div>

          {review.containsSpoilers && !showSpoiler ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-400">Contains spoilers</span>
              <button onClick={() => setShowSpoiler(true)} className="ml-auto text-xs text-white/50 hover:text-white underline">Reveal</button>
            </div>
          ) : (
            <p className="text-sm text-white/70 leading-relaxed line-clamp-4">{review.body}</p>
          )}

          {review.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {review.tags.map(tag => (
                <span key={tag} className="text-xs text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <button onClick={toggleLike} className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''}`} />
              {likeCount > 0 && likeCount}
            </button>
            {review.isRewatch && (
              <span className="text-xs text-purple-400/70 bg-purple-400/10 px-2 py-0.5 rounded-full">Rewatch</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
