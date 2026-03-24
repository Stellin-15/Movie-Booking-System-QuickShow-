import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, UserMinus, Users } from 'lucide-react'
import useSocialStore from '../stores/useSocialStore'
import { apiFetch } from '../api/http'
import { getFollowing, getFollowers } from '../api/social'

export default function Friends() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { suggestions, fetchSuggestions, toggleFollow } = useSocialStore()
  const [activeTab, setActiveTab] = useState('following')
  const [following, setFollowing] = useState([])
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(false)
  const [me, setMe] = useState(null)

  useEffect(() => {
    apiFetch('/api/users/me', {}, getToken).then(u => {
      setMe(u)
      getFollowing(u.clerkId).then(setFollowing)
      getFollowers(u.clerkId).then(setFollowers)
    }).catch(() => {})
    fetchSuggestions(getToken)
  }, [])

  const handleToggleFollow = async (clerkId) => {
    const isNowFollowing = await toggleFollow(getToken, clerkId)
    if (isNowFollowing) {
      const user = suggestions.find(s => s.clerkId === clerkId) || followers.find(f => f.clerkId === clerkId)
      if (user && !following.find(f => f.clerkId === clerkId)) setFollowing(prev => [...prev, user])
    } else {
      setFollowing(prev => prev.filter(f => f.clerkId !== clerkId))
    }
  }

  const UserRow = ({ user, isFollowing }) => (
    <div className="flex items-center gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/15 transition-all">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 text-sm">
        {user.name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <p className="text-xs text-white/40">@{user.username} · {user.totalWatched || 0} watched</p>
        {user.badges?.length > 0 && (
          <div className="flex gap-1 mt-1">
            {user.badges.slice(0, 2).map(b => (
              <span key={b} className="text-xs bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded-full">{b.replace(/_/g, ' ')}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(`/profile/${user.username}`)} className="text-xs text-white/40 hover:text-white px-3 py-1.5 border border-white/10 rounded-full transition-colors">
          Profile
        </button>
        <button onClick={() => handleToggleFollow(user.clerkId)}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${isFollowing ? 'bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/30' : 'bg-primary hover:bg-primary-dull text-white'}`}>
          {isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Unfollow</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
        </button>
      </div>
    </div>
  )

  const tabs = [
    { key: 'following', label: `Following (${following.length})` },
    { key: 'followers', label: `Followers (${followers.length})` },
    { key: 'discover', label: 'Discover' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 bg-white/5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'following' && (
        <div className="flex flex-col gap-3">
          {following.length === 0 ? (
            <div className="text-center py-16 text-white/30">You're not following anyone yet. <button onClick={() => setActiveTab('discover')} className="text-primary hover:underline">Discover people →</button></div>
          ) : following.map(u => <UserRow key={u.clerkId} user={u} isFollowing={true} />)}
        </div>
      )}

      {activeTab === 'followers' && (
        <div className="flex flex-col gap-3">
          {followers.length === 0 ? (
            <div className="text-center py-16 text-white/30">No followers yet</div>
          ) : followers.map(u => {
            const isF = following.some(f => f.clerkId === u.clerkId)
            return <UserRow key={u.clerkId} user={u} isFollowing={isF} />
          })}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/40 mb-2">People with similar taste to you</p>
          {suggestions.length === 0 ? (
            <div className="text-center py-16 text-white/30">Add more movies to your library to get suggestions</div>
          ) : suggestions.map(u => {
            const isF = following.some(f => f.clerkId === u.clerkId)
            return <UserRow key={u.clerkId} user={u} isFollowing={isF} />
          })}
        </div>
      )}
    </div>
  )
}
