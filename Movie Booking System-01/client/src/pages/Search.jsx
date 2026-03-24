import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon, Film, Users, List } from 'lucide-react'
import { searchMovies } from '../api/movies'
import { apiFetch } from '../api/http'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'

function useDebounce(v, d) {
  const [val, setVal] = React.useState(v)
  React.useEffect(() => { const t = setTimeout(() => setVal(v), d); return () => clearTimeout(t) }, [v, d])
  return val
}

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 400)

  React.useEffect(() => {
    if (!debouncedQuery.trim()) { setMovies([]); setUsers([]); return }
    setLoading(true)
    Promise.all([
      searchMovies({ query: debouncedQuery }).then(d => setMovies(d.results?.slice(0, 8) || [])),
      // User search would need a backend endpoint — skipping for now
    ]).finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <h1 className="text-3xl font-bold mb-6">Search</h1>

      <div className="relative mb-8 max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies, people, lists..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm placeholder-white/25 focus:outline-none focus:border-primary/50 transition-colors text-base"
        />
      </div>

      {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}

      {!loading && query && movies.length === 0 && (
        <p className="text-white/30 text-center py-12">No results for "{query}"</p>
      )}

      {movies.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 text-sm text-white/40">
            <Film className="w-4 h-4" />
            <span>Movies</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-10">
            {movies.map(m => (
              <div key={m.id} onClick={() => { navigate(`/movies/${m.id}`); window.scrollTo(0, 0) }}
                className="cursor-pointer group">
                {m.poster_path ? (
                  <img src={`${TMDB_IMG}${m.poster_path}`} alt={m.title} className="w-full aspect-[2/3] object-cover rounded-xl mb-2 group-hover:opacity-80 transition" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 rounded-xl mb-2 flex items-center justify-center"><Film className="w-6 h-6 text-white/20" /></div>
                )}
                <p className="text-xs font-medium truncate">{m.title}</p>
                <p className="text-xs text-white/30">{m.release_date?.slice(0, 4)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
