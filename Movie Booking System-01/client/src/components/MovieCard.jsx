import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Star, BookmarkPlus, Eye, ChevronDown } from 'lucide-react'
import useLibraryStore from '../stores/useLibraryStore'
import StatusBadge from './ui/StatusBadge'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

const MovieCard = ({ movie }) => {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()
  const [showMenu, setShowMenu] = useState(false)
  const addItem = useLibraryStore(s => s.addItem)
  const getStatus = useLibraryStore(s => s.getStatus)

  const status = getStatus(movie.id || movie.tmdbId)
  const posterSrc = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` :
    movie.backdrop_path?.startsWith('http') ? movie.backdrop_path : movie.backdrop_path ? `${TMDB_IMG}${movie.backdrop_path}` : null

  const handleQuickAdd = async (e, newStatus) => {
    e.stopPropagation()
    if (!isSignedIn) { navigate('/'); return }
    setShowMenu(false)
    await addItem(getToken, {
      tmdbId: movie.id || movie.tmdbId,
      title: movie.title,
      posterPath: movie.poster_path || '',
      backdropPath: movie.backdrop_path || '',
      releaseYear: movie.release_date ? parseInt(movie.release_date) : null,
      genres: movie.genres?.map(g => g.name || g) || [],
      runtime: movie.runtime || null
    }, newStatus)
  }

  return (
    <div className="flex flex-col bg-[#111] rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 w-52 flex-shrink-0">
      {/* Poster */}
      <div className="relative cursor-pointer" onClick={() => { navigate(`/movies/${movie.id || movie.tmdbId}`); window.scrollTo(0, 0) }}>
        {posterSrc ? (
          <img src={posterSrc} alt={movie.title} className="h-72 w-full object-cover" />
        ) : (
          <div className="h-72 w-full bg-white/5 flex items-center justify-center text-white/20 text-sm">No Image</div>
        )}
        {status && (
          <div className="absolute top-2 left-2">
            <StatusBadge status={status} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="font-semibold text-sm truncate">{movie.title}</p>
        <p className="text-xs text-white/40">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'}
          {movie.genres?.length > 0 && ` · ${(movie.genres[0]?.name || movie.genres[0])}`}
        </p>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
          </div>

          {/* Quick add dropdown */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(o => !o) }}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
            >
              <BookmarkPlus className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
            {showMenu && (
              <div className="absolute right-0 bottom-7 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-20 w-36 py-1 overflow-hidden">
                {['watched', 'watchlist', 'watching', 'dropped'].map(s => (
                  <button key={s} onClick={(e) => handleQuickAdd(e, s)} className="w-full text-left px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 capitalize transition-colors">
                    {s === 'watched' && '✓ '}{s === 'watchlist' && '🔖 '}{s === 'watching' && '▶ '}{s === 'dropped' && '✗ '}{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieCard
