import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Eye, Bookmark, Play, X, RefreshCw, Star, Trash2, StickyNote } from 'lucide-react'
import useLibraryStore from '../stores/useLibraryStore'
import useUserStore from '../stores/useUserStore'
import StarRating from '../components/ui/StarRating'
import StatusBadge from '../components/ui/StatusBadge'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

const TABS = [
  { key: 'watched', label: 'Watched', icon: Eye },
  { key: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { key: 'watching', label: 'Watching', icon: Play },
  { key: 'rewatching', label: 'Rewatching', icon: RefreshCw },
  { key: 'dropped', label: 'Dropped', icon: X },
]

export default function Library() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const fetchLibrary = useLibraryStore(s => s.fetchLibrary)
  const getByStatus = useLibraryStore(s => s.getByStatus)
  const updateItem = useLibraryStore(s => s.updateItem)
  const removeItem = useLibraryStore(s => s.removeItem)
  const loaded = useLibraryStore(s => s.loaded)
  const profile = useUserStore(s => s.profile)

  const [activeTab, setActiveTab] = useState('watched')
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => { if (!loaded) fetchLibrary(getToken) }, [loaded])

  const items = getByStatus(activeTab)

  const handleRating = async (tmdbId, rating) => {
    await updateItem(getToken, tmdbId, { userRating: rating })
  }

  const saveNote = async (tmdbId) => {
    await updateItem(getToken, tmdbId, { notes: noteText })
    setEditingNote(null)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Library</h1>
          <p className="text-white/40 text-sm">Your personal film diary</p>
        </div>
        {profile?.plan === 'pro' && (
          <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs text-primary font-medium">Pro</span>
        )}
      </div>

      {/* Upgrade banner for free users near limit */}
      {profile?.plan === 'free' && items.length > 450 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-yellow-400">You're near the 500 movie free tier limit.</p>
          <button className="text-xs bg-primary px-3 py-1.5 rounded-full font-medium">Upgrade to Pro</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-thin">
        {TABS.map(tab => {
          const count = getByStatus(tab.key).length
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/30' : 'bg-white/10'}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/20 text-lg mb-3">Nothing here yet</p>
          <button onClick={() => navigate('/movies')} className="text-sm text-primary hover:underline">Browse movies →</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map(item => (
            <div key={item.tmdbId} className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all">
              {/* Poster */}
              <div className="relative cursor-pointer" onClick={() => { navigate(`/movies/${item.tmdbId}`); window.scrollTo(0, 0) }}>
                {item.posterPath ? (
                  <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20 text-xs">No Image</div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeItem(getToken, item.tmdbId) }}
                    className="p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2.5">
                <p className="text-xs font-medium truncate mb-1">{item.title}</p>
                {item.releaseYear && <p className="text-xs text-white/30 mb-2">{item.releaseYear}</p>}

                {/* Star rating */}
                <div className="mb-2">
                  <StarRating
                    value={item.userRating || 0}
                    onChange={(r) => handleRating(item.tmdbId, r)}
                    size="sm"
                  />
                </div>

                {/* Note button */}
                {editingNote === item.tmdbId ? (
                  <div className="mt-2">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Private note..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-white/20 focus:outline-none resize-none"
                      rows={2}
                      onClick={e => e.stopPropagation()}
                    />
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => saveNote(item.tmdbId)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                      <button onClick={() => setEditingNote(null)} className="text-xs text-white/30 hover:text-white ml-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNote(item.tmdbId); setNoteText(item.notes || '') }}
                    className="flex items-center gap-1 text-xs text-white/25 hover:text-white/60 transition-colors"
                  >
                    <StickyNote className="w-3 h-3" />
                    {item.notes ? 'Edit note' : 'Add note'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
