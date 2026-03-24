import React, { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Plus, List, GitFork, Bookmark, Lock } from 'lucide-react'
import { getLists, createList, getMyLists } from '../api/lists'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

function ListCard({ list, onClick }) {
  const cover = list.movies?.[0]?.posterPath ? `${TMDB_IMG}${list.movies[0].posterPath}` : null
  return (
    <div onClick={onClick} className="group bg-[#111] border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5">
      <div className="h-36 bg-white/5 overflow-hidden relative">
        {cover ? <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><List className="w-10 h-10 text-white/10" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {list.isSponsored && (
          <span className="absolute top-2 left-2 text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-semibold">Sponsored</span>
        )}
        {!list.isPublic && <Lock className="absolute top-2 right-2 w-4 h-4 text-white/60" />}
      </div>
      <div className="p-4">
        <p className="font-semibold text-sm mb-1 truncate">{list.title}</p>
        {list.description && <p className="text-xs text-white/40 line-clamp-2 mb-3">{list.description}</p>}
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span>{list.movies?.length || 0} films</span>
          {list.saveCount > 0 && <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{list.saveCount}</span>}
          {list.forkCount > 0 && <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{list.forkCount}</span>}
          {list.isRanked && <span className="text-primary/60">Ranked</span>}
          {list.isChallengeList && <span className="text-purple-400/60">Challenge</span>}
        </div>
      </div>
    </div>
  )
}

export default function Lists() {
  const { getToken } = useAuth()
  const { isSignedIn } = useUser()
  const navigate = useNavigate()
  const [lists, setLists] = useState([])
  const [myLists, setMyLists] = useState([])
  const [activeTab, setActiveTab] = useState('browse')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', isRanked: false, isChallengeList: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getLists().then(setLists).catch(() => {})
    if (isSignedIn) getMyLists(getToken).then(setMyLists).catch(() => {})
  }, [isSignedIn])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const list = await createList(getToken, { ...form, isPublic: true })
      setMyLists(prev => [list, ...prev])
      setCreating(false)
      setForm({ title: '', description: '', isRanked: false, isChallengeList: false })
      navigate(`/lists/${list._id}`)
    } catch (err) {
      if (err.status === 402) alert('Upgrade to Pro for unlimited CineLists!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">CineLists</h1>
          <p className="text-white/40 text-sm">Curated movie collections, shareable like Spotify playlists</p>
        </div>
        {isSignedIn && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dull rounded-full text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> New List
          </button>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-5">Create a CineList</h2>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="List title..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-primary/50" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none mb-4 focus:outline-none focus:border-primary/50" rows={3} />
            <div className="flex gap-4 mb-5">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.isRanked} onChange={e => setForm(f => ({ ...f, isRanked: e.target.checked }))} className="accent-primary" />
                Ranked list
              </label>
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.isChallengeList} onChange={e => setForm(f => ({ ...f, isChallengeList: e.target.checked }))} className="accent-primary" />
                Challenge list
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={loading || !form.title.trim()} className="flex-1 py-2.5 bg-primary hover:bg-primary-dull disabled:opacity-40 rounded-full text-sm font-semibold transition-all">
                {loading ? 'Creating...' : 'Create List'}
              </button>
              <button onClick={() => setCreating(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-2xl w-fit">
        {[{ key: 'browse', label: 'Browse' }, ...(isSignedIn ? [{ key: 'mine', label: 'My Lists' }] : [])].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {(activeTab === 'browse' ? lists : myLists).map(list => (
          <ListCard key={list._id} list={list} onClick={() => navigate(`/lists/${list._id}`)} />
        ))}
      </div>
    </div>
  )
}
