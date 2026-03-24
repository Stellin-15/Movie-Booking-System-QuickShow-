import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { GitFork, Bookmark, Plus, Trash2, GripVertical, Lock, Globe } from 'lucide-react'
import { getList, forkList, saveList, addMovieToList, removeMovieFromList } from '../api/lists'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { isSignedIn, user } = useUser()
  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [forking, setForking] = useState(false)

  useEffect(() => {
    getList(id).then(data => { setList(data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    const res = await saveList(getToken, id)
    setSaved(res.saved)
    setList(l => ({ ...l, saveCount: res.saveCount }))
  }

  const handleFork = async () => {
    setForking(true)
    const fork = await forkList(getToken, id).catch(() => null)
    setForking(false)
    if (fork) { setList(l => ({ ...l, forkCount: (l.forkCount || 0) + 1 })); navigate(`/lists/${fork._id}`) }
  }

  const handleRemoveMovie = async (tmdbId) => {
    await removeMovieFromList(getToken, id, tmdbId)
    setList(l => ({ ...l, movies: l.movies.filter(m => m.tmdbId !== tmdbId) }))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!list) return <div className="min-h-screen flex items-center justify-center text-white/40">List not found</div>

  const isOwner = user && list.ownerId === user.id
  const cover = list.movies?.[0]?.posterPath ? `${TMDB_IMG}${list.movies[0].posterPath}` : null

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex gap-6 mb-10 items-start">
          {cover && <img src={cover} alt="" className="w-28 h-40 object-cover rounded-xl flex-shrink-0 shadow-2xl border border-white/10" />}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {list.isPublic ? <Globe className="w-4 h-4 text-white/30" /> : <Lock className="w-4 h-4 text-white/30" />}
              {list.isSponsored && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-semibold">{list.sponsorName}</span>}
              {list.isRanked && <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">Ranked</span>}
              {list.isChallengeList && <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">Challenge</span>}
            </div>
            <h1 className="text-3xl font-bold mb-2">{list.title}</h1>
            {list.description && <p className="text-white/50 text-sm mb-4">{list.description}</p>}
            <div className="flex items-center gap-2 text-xs text-white/30 mb-5">
              <span>{list.movies?.length || 0} films</span>
              <span>·</span>
              <span>{list.saveCount || 0} saves</span>
              <span>·</span>
              <span>{list.forkCount || 0} forks</span>
            </div>
            {isSignedIn && (
              <div className="flex gap-3">
                <button onClick={handleSave} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${saved ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-blue-400' : ''}`} /> {saved ? 'Saved' : 'Save'}
                </button>
                {!isOwner && (
                  <button onClick={handleFork} disabled={forking} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-white/60 hover:text-white transition-all">
                    <GitFork className="w-4 h-4" /> {forking ? 'Forking...' : 'Fork'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Movies */}
        <div className="flex flex-col gap-3">
          {list.movies?.map((movie, idx) => (
            <div key={movie.tmdbId} className="flex items-center gap-4 p-3 bg-white/3 border border-white/8 rounded-2xl hover:border-white/15 transition-all group">
              {list.isRanked && <span className="text-white/30 text-sm font-bold w-6 text-center flex-shrink-0">{idx + 1}</span>}
              {movie.posterPath ? (
                <img src={`${TMDB_IMG}${movie.posterPath}`} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 bg-white/5 rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { navigate(`/movies/${movie.tmdbId}`); window.scrollTo(0, 0) }}>
                <p className="font-medium text-sm">{movie.title}</p>
                {movie.note && <p className="text-xs text-white/40 mt-0.5">{movie.note}</p>}
              </div>
              {isOwner && (
                <button onClick={() => handleRemoveMovie(movie.tmdbId)} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {list.movies?.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <p className="mb-3">No movies in this list yet</p>
            <p className="text-sm">Add movies from their detail pages</p>
          </div>
        )}
      </div>
    </div>
  )
}
