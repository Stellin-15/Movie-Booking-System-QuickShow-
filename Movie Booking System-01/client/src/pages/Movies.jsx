import React, { useEffect, useState, useCallback } from 'react'
import { SearchIcon } from 'lucide-react'
import MovieCard from '../components/MovieCard'
import GenrePill from '../components/ui/GenrePill'
import { searchMovies, getGenres } from '../api/movies'

const YEARS = [{ label: 'Any Year', value: '' }, { label: '2020s', value: '2020' }, { label: '2010s', value: '2010' }, { label: '2000s', value: '2000' }, { label: "90s", value: '1990' }, { label: "80s", value: '1980' }]
const RATINGS = [{ label: 'Any Rating', value: '' }, { label: '9+', value: '9' }, { label: '8+', value: '8' }, { label: '7+', value: '7' }, { label: '6+', value: '6' }]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Movies() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => { getGenres().then(setGenres).catch(() => {}) }, [])

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    try {
      const data = await searchMovies({
        query: debouncedQuery || undefined,
        genre: selectedGenre || undefined,
        yearFrom: selectedYear || undefined,
        yearTo: selectedYear ? String(parseInt(selectedYear) + 9) : undefined,
        minRating: selectedRating || undefined,
        page: currentPage
      })
      setMovies(prev => reset ? data.results : [...prev, ...data.results])
      setTotalPages(Math.min(data.total_pages, 500))
      if (reset) setPage(2); else setPage(p => p + 1)
    } catch { }
    setLoading(false)
  }, [debouncedQuery, selectedGenre, selectedYear, selectedRating, page])

  useEffect(() => { load(true) }, [debouncedQuery, selectedGenre, selectedYear, selectedRating])

  const selectTag = `bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none cursor-pointer`

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <h1 className="text-3xl font-bold mb-1">Movies</h1>
      <p className="text-white/40 text-sm mb-8">Discover, search, and add to your library</p>

      {/* Search */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies..."
          className="w-full max-w-xl bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
        <GenrePill label="All" active={!selectedGenre} onClick={() => setSelectedGenre('')} />
        {genres.map(g => <GenrePill key={g.id} label={g.name} active={selectedGenre === String(g.id)} onClick={() => setSelectedGenre(String(g.id))} />)}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-10 flex-wrap">
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={selectTag}>
          {YEARS.map(y => <option key={y.value} value={y.value} className="bg-[#111]">{y.label}</option>)}
        </select>
        <select value={selectedRating} onChange={e => setSelectedRating(e.target.value)} className={selectTag}>
          {RATINGS.map(r => <option key={r.value} value={r.value} className="bg-[#111]">{r.label}</option>)}
        </select>
      </div>

      {/* Results */}
      {movies.length === 0 && !loading ? (
        <div className="text-center text-white/30 py-24">No movies found. Try adjusting your filters.</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {movies.map(m => <MovieCard key={`${m.id}-${Math.random()}`} movie={m} />)}
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-52 h-[22rem] bg-white/5 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      )}

      {!loading && page <= totalPages && movies.length > 0 && (
        <div className="flex justify-center mt-14">
          <button onClick={() => load()} className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all">
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
