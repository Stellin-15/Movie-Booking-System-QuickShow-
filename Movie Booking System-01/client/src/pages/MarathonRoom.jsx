import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { io } from 'socket.io-client'
import { Film, Plus, Vote, Trophy, Send, Users, Copy, Check } from 'lucide-react'
import { apiFetch } from '../api/http'
import { searchMovies as searchMoviesApi } from '../api/movies'
import useUserStore from '../stores/useUserStore'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'

export default function MarathonRoom() {
  const { roomCode } = useParams()
  const { getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [copied, setCopied] = useState(false)
  const socketRef = useRef(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    // Fetch initial room state
    apiFetch(`/api/marathon/${roomCode}`, {}, getToken).then(r => { setRoom(r); setLoading(false) }).catch(() => setLoading(false))

    // Connect socket
    const socket = io(`${BASE}/marathon`)
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_room', { roomCode, clerkId: clerkUser?.id, username: profile?.name || clerkUser?.fullName || 'Guest' })
    })

    socket.on('room_state', setRoom)
    socket.on('chat_message', (msg) => setMessages(prev => [...prev, msg]))
    socket.on('user_joined', (data) => setMessages(prev => [...prev, { type: 'system', text: `${data.username} joined`, timestamp: data.timestamp }]))
    socket.on('user_left', (data) => setMessages(prev => [...prev, { type: 'system', text: `${data.username} left`, timestamp: new Date() }]))
    socket.on('winner_revealed', (data) => setMessages(prev => [...prev, { type: 'system', text: `🎬 Winner: ${data.movie?.title}!`, timestamp: new Date() }]))

    return () => socket.disconnect()
  }, [roomCode])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendChat = () => {
    if (!chatInput.trim()) return
    socketRef.current?.emit('chat_message', { message: chatInput })
    setChatInput('')
  }

  const nominate = async (movie) => {
    try {
      const updated = await apiFetch(`/api/marathon/${roomCode}/nominate`, { method: 'POST', body: JSON.stringify({ tmdbId: movie.id, title: movie.title, posterPath: movie.poster_path }) }, getToken)
      setRoom(updated)
      socketRef.current?.emit('movie_nominated', { roomCode, movie })
      setSearchResults([])
      setSearchQuery('')
    } catch (err) { alert(err.data?.error || 'Failed to nominate') }
  }

  const vote = async (tmdbId) => {
    try {
      const updated = await apiFetch(`/api/marathon/${roomCode}/vote/${tmdbId}`, { method: 'POST' }, getToken)
      setRoom(updated)
      socketRef.current?.emit('vote_cast', { roomCode })
    } catch { }
  }

  const startVoting = async () => {
    const updated = await apiFetch(`/api/marathon/${roomCode}/start-voting`, { method: 'POST' }, getToken)
    setRoom(updated)
  }

  const reveal = async () => {
    const updated = await apiFetch(`/api/marathon/${roomCode}/reveal`, { method: 'POST' }, getToken)
    setRoom(updated)
    if (updated.chosenMovieTmdbId) {
      const winner = updated.candidateMovies.find(m => m.tmdbId === updated.chosenMovieTmdbId)
      socketRef.current?.emit('winner_revealed', { roomCode, movie: winner })
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!room) return <div className="min-h-screen flex items-center justify-center text-white/40">Room not found</div>

  const isHost = room.hostId === clerkUser?.id
  const myVote = room.candidateMovies?.find(m => m.votes?.includes(clerkUser?.id))?.tmdbId

  return (
    <div className="min-h-screen pt-20 pb-4 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Marathon Room</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-sm">Code:</span>
              <button onClick={copyCode} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-sm font-mono tracking-widest hover:bg-white/10 transition-all">
                {roomCode}
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
              </button>
              <span className="flex items-center gap-1 text-xs text-white/30"><Users className="w-3.5 h-3.5" />{room.members?.length || 1}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
              room.status === 'lobby' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
              room.status === 'voting' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
              'bg-green-500/15 border-green-500/30 text-green-400'
            }`}>{room.status}</span>
            {isHost && room.status === 'lobby' && room.candidateMovies?.length > 0 && (
              <button onClick={startVoting} className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-full text-sm font-semibold hover:bg-yellow-500/30 transition-all">Start Voting</button>
            )}
            {isHost && room.status === 'voting' && (
              <button onClick={reveal} className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-sm font-semibold hover:bg-green-500/30 transition-all flex items-center gap-1">
                <Trophy className="w-4 h-4" /> Reveal Winner
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Movie nominations + voting */}
          <div className="lg:col-span-2">
            {/* Winner banner */}
            {room.status === 'watching' && room.chosenMovieTmdbId && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                <Trophy className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-semibold text-green-400">Tonight's Pick</p>
                  <p className="text-sm text-white/60">{room.candidateMovies?.find(m => m.tmdbId === room.chosenMovieTmdbId)?.title}</p>
                </div>
                <button onClick={() => navigate(`/movies/${room.chosenMovieTmdbId}`)} className="ml-auto text-sm text-primary hover:underline">View →</button>
              </div>
            )}

            {/* Search to nominate */}
            {room.status === 'lobby' && (
              <div className="mb-4">
                <input value={searchQuery} onChange={async e => { setSearchQuery(e.target.value); if (e.target.value.length > 2) { const r = await searchMoviesApi({ query: e.target.value }); setSearchResults(r.results?.slice(0, 5) || []) } else setSearchResults([]) }}
                  placeholder="Search and nominate a movie..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-primary/50" />
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
                    {searchResults.map(m => (
                      <button key={m.id} onClick={() => nominate(m)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
                        {m.poster_path && <img src={`${TMDB_IMG}${m.poster_path}`} className="w-8 h-11 object-cover rounded" alt="" />}
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-white/30">{m.release_date?.slice(0, 4)}</p>
                        </div>
                        <Plus className="w-4 h-4 text-primary ml-auto" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Candidate movies */}
            <div className="flex flex-col gap-3">
              {room.candidateMovies?.length === 0 && room.status === 'lobby' && (
                <p className="text-white/30 text-sm text-center py-8">No movies nominated yet. Search above to add one!</p>
              )}
              {room.candidateMovies?.map(movie => (
                <div key={movie.tmdbId} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${room.chosenMovieTmdbId === movie.tmdbId ? 'bg-green-500/10 border-green-500/30' : myVote === movie.tmdbId ? 'bg-primary/10 border-primary/30' : 'bg-white/3 border-white/8'}`}>
                  {movie.posterPath && <img src={`${TMDB_IMG}${movie.posterPath}`} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{movie.title}</p>
                    <p className="text-xs text-white/30 mt-0.5">Nominated by {movie.addedBy?.slice(0, 8)}...</p>
                    {room.status !== 'lobby' && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${room.members?.length ? (movie.votes?.length / room.members.length) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-white/40">{movie.votes?.length || 0} vote{movie.votes?.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  {room.status === 'voting' && (
                    <button onClick={() => vote(movie.tmdbId)} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${myVote === movie.tmdbId ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}>
                      <Vote className="w-4 h-4" />
                    </button>
                  )}
                  {room.chosenMovieTmdbId === movie.tmdbId && <Trophy className="w-5 h-5 text-green-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col bg-white/3 border border-white/8 rounded-2xl overflow-hidden h-[500px]">
            <div className="p-3 border-b border-white/8 text-sm font-medium text-white/60">Live Chat</div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.type === 'system' ? (
                    <p className="text-xs text-white/25 text-center">{msg.text}</p>
                  ) : (
                    <div className="text-sm">
                      <span className="text-primary/70 font-medium">{msg.username}: </span>
                      <span className="text-white/70">{msg.message}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/8 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Say something..."
                className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm placeholder-white/20 focus:outline-none" />
              <button onClick={sendChat} className="p-2 text-primary hover:text-primary/70 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
