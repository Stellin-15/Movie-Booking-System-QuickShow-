import React, { useEffect, useState } from 'react'
import { CalendarIcon, Clock10Icon, ArrowRight, Star, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getTrending } from '../api/movies'

const TMDB_BG = 'https://image.tmdb.org/t/p/original'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w200'

const HeroSection = () => {
  const [movie, setMovie] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getTrending('week').then(results => {
      if (results?.length > 0) setMovie(results[0])
    }).catch(() => {})
  }, [])

  if (!movie) {
    return (
      <div className="h-screen bg-gradient-to-b from-black/80 to-[#090909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const year = movie.release_date?.slice(0, 4)
  const genres = movie.genre_ids?.slice(0, 3).join(' · ')

  return (
    <div
      className="relative flex flex-col items-start justify-end px-6 md:px-16 lg:px-24 pb-20 h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${TMDB_BG}${movie.backdrop_path})` }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-yellow-400 font-semibold text-sm">{movie.vote_average?.toFixed(1)}</span>
          <span className="text-white/40 text-sm">· Trending #1 this week</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-4">{movie.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-4">
          {year && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              <span>{year}</span>
            </div>
          )}
          {movie.original_language && (
            <span className="uppercase px-2 py-0.5 rounded border border-white/20 text-xs">{movie.original_language}</span>
          )}
        </div>

        <p className="max-w-md text-white/70 text-sm leading-relaxed mb-8 line-clamp-3">{movie.overview}</p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { navigate(`/movies/${movie.id}`); window.scrollTo(0, 0) }}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-semibold"
          >
            <Play className="w-4 h-4 fill-white" />
            View Details
          </button>
          <button
            onClick={() => { navigate('/discover') }}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-white/10 hover:bg-white/20 transition rounded-full font-semibold border border-white/10"
          >
            AI Pick for Me
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
