import React, { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BlurCircle from './BlurCircle'
import MovieCard from './MovieCard'
import { getTrending } from '../api/movies'

const FeaturedSection = () => {
  const [movies, setMovies] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getTrending('week').then(results => setMovies(results?.slice(0, 8) || [])).catch(() => {})
  }, [])

  return (
    <div className="px-6 md:px-16 lg:px-24 overflow-hidden">
      <div className="relative flex items-center justify-between pt-16 pb-8">
        <BlurCircle top="0" right="-80px" />
        <div>
          <p className="text-xs text-primary font-medium uppercase tracking-widest mb-1">This Week</p>
          <h2 className="text-2xl font-bold">Trending Now</h2>
        </div>
        <button
          onClick={() => { navigate('/movies'); window.scrollTo(0, 0) }}
          className="group flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          View All
          <ArrowRight className="group-hover:translate-x-0.5 transition w-4 h-4" />
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {movies.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0 h-96 bg-white/5 rounded-2xl animate-pulse" />
            ))
          : movies.map(movie => <MovieCard key={movie.id} movie={movie} />)
        }
      </div>

      <div className="flex justify-center mt-12 mb-4">
        <button
          onClick={() => { navigate('/movies'); window.scrollTo(0, 0) }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-semibold cursor-pointer"
        >
          Explore All Movies
        </button>
      </div>
    </div>
  )
}

export default FeaturedSection
