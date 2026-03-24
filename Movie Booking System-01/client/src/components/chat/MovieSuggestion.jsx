import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Clock, Eye, BookmarkPlus, Sparkles } from 'lucide-react'
import useLibraryStore from '../../stores/useLibraryStore'
import { useAuth } from '@clerk/clerk-react'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

export default function MovieSuggestion({ pick, blindMode, revealed, onReveal }) {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const addItem = useLibraryStore(s => s.addItem)
  const [added, setAdded] = useState(false)

  const handleAddWatchlist = async (e) => {
    e.stopPropagation()
    await addItem(getToken, {
      tmdbId: pick.tmdbId,
      title: pick.title,
      posterPath: pick.posterPath || '',
      genres: pick.genres || []
    }, 'watchlist')
    setAdded(true)
  }

  // Blind mode: show locked card until revealed
  if (blindMode && !revealed) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 text-center w-52 flex-shrink-0">
        <div className="w-full h-48 bg-white/5 rounded-xl flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary/40" />
        </div>
        <p className="text-white/40 text-sm">Mystery pick...</p>
        <button onClick={onReveal} className="px-4 py-2 bg-primary hover:bg-primary-dull rounded-full text-xs font-semibold transition-all">
          Reveal
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden w-52 flex-shrink-0 group hover:border-white/20 transition-all">
      {/* Poster */}
      <div className="relative cursor-pointer" onClick={() => { navigate(`/movies/${pick.tmdbId}`); window.scrollTo(0, 0) }}>
        {pick.posterPath ? (
          <img src={`${TMDB_IMG}${pick.posterPath}`} alt={pick.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-white/5 flex items-center justify-center">
            <Eye className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-3">
        <p className="font-semibold text-sm mb-1 truncate">{pick.title}</p>
        <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
          {pick.imdbRating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {pick.imdbRating}
            </div>
          )}
          {pick.runtime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.floor(pick.runtime / 60)}h {pick.runtime % 60}m
            </div>
          )}
        </div>

        {/* AI reason */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2 mb-3">
          <p className="text-xs text-primary/80 leading-relaxed italic">"{pick.reason}"</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { navigate(`/movies/${pick.tmdbId}`); window.scrollTo(0, 0) }}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium transition-all">
            Details
          </button>
          <button onClick={handleAddWatchlist} disabled={added}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${added ? 'bg-green-500/20 text-green-400' : 'bg-primary/20 hover:bg-primary/30 text-primary'}`}>
            {added ? '✓ Added' : <><BookmarkPlus className="w-3 h-3 inline mr-1" />Watchlist</>}
          </button>
        </div>
      </div>
    </div>
  )
}
