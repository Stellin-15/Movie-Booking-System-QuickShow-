import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Film, Users, ArrowRight, Hash } from 'lucide-react'
import { apiFetch } from '../api/http'

export default function Marathon() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const createRoom = async () => {
    setCreating(true)
    setError('')
    try {
      const room = await apiFetch('/api/marathon', { method: 'POST' }, getToken)
      navigate(`/marathon/${room.roomCode}`)
    } catch { setError('Failed to create room. Please try again.') }
    setCreating(false)
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    setError('')
    try {
      const room = await apiFetch('/api/marathon/join', { method: 'POST', body: JSON.stringify({ roomCode: joinCode.toUpperCase() }) }, getToken)
      navigate(`/marathon/${room.roomCode}`)
    } catch (err) {
      setError(err.data?.error || 'Room not found. Check the code and try again.')
    }
    setJoining(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Movie Marathon</h1>
          <p className="text-white/40 text-sm">Get together with friends, nominate movies, vote on what to watch</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}

        {/* Create */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Host a Room</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">Create a room and share the code with friends</p>
          <button onClick={createRoom} disabled={creating} className="w-full py-3 bg-primary hover:bg-primary-dull disabled:opacity-50 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
            {creating ? 'Creating...' : <><Film className="w-4 h-4" /> Create Room</>}
          </button>
        </div>

        {/* Join */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Hash className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold">Join a Room</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">Enter the 6-character room code to join</p>
          <div className="flex gap-2">
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123"
              maxLength={6} onKeyDown={e => e.key === 'Enter' && joinRoom()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase placeholder-white/20 focus:outline-none focus:border-primary/50" />
            <button onClick={joinRoom} disabled={joining || joinCode.length < 6} className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 transition-all disabled:opacity-40">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
