import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Star, Eye, Film, Users, Award, UserPlus, UserMinus } from 'lucide-react'
import { getUser, getCompatibility } from '../api/users'
import { getFollowers, getFollowing, isFollowing as checkFollowing, followUser } from '../api/social'
import { apiFetch } from '../api/http'
import ReviewCard from '../components/social/ReviewCard'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

const BADGE_LABELS = {
  century_club: { label: 'Century Club', icon: '🎬', color: 'text-yellow-400' },
  first_watch: { label: 'First Watch', icon: '👁️', color: 'text-blue-400' },
  first_review: { label: 'Critic', icon: '✍️', color: 'text-green-400' },
  list_maker: { label: 'List Maker', icon: '📋', color: 'text-purple-400' },
  social_butterfly: { label: 'Social Butterfly', icon: '🦋', color: 'text-pink-400' },
  streak_7: { label: 'On a Streak', icon: '🔥', color: 'text-orange-400' },
  contrarian: { label: 'Contrarian', icon: '💢', color: 'text-red-400' },
}

export default function Profile() {
  const { username } = useParams()
  const { getToken } = useAuth()
  const { user: clerkUser, isSignedIn } = useUser()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [following, setFollowing] = useState(false)
  const [compatibility, setCompatibility] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser(username).then(async (user) => {
      setProfile(user)
      setLoading(false)

      const [followers, followingList] = await Promise.all([
        getFollowers(user.clerkId),
        getFollowing(user.clerkId)
      ])
      setFollowerCount(followers.length)
      setFollowingCount(followingList.length)

      apiFetch(`/api/reviews/user/${user.clerkId}`).then(setReviews).catch(() => {})

      if (isSignedIn) {
        checkFollowing(getToken, user.clerkId).then(r => setFollowing(r.following)).catch(() => {})
        getCompatibility(getToken, username).then(r => setCompatibility(r.score)).catch(() => {})
      }
    }).catch(() => setLoading(false))
  }, [username])

  const handleToggleFollow = async () => {
    const res = await followUser(getToken, profile.clerkId)
    setFollowing(res.following)
    setFollowerCount(c => res.following ? c + 1 : c - 1)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-white/40">User not found</div>

  const isOwnProfile = isSignedIn && clerkUser?.username === username

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="flex gap-6 items-start mb-10">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary flex-shrink-0">
            {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full rounded-2xl object-cover" /> : profile.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.plan === 'pro' && <span className="text-xs bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-medium">Pro</span>}
            </div>
            <p className="text-white/40 text-sm mb-2">@{profile.username}</p>
            {profile.bio && <p className="text-white/60 text-sm mb-3 max-w-md">{profile.bio}</p>}

            {/* Stats row */}
            <div className="flex gap-6 text-sm mb-4">
              <div className="text-center">
                <p className="font-bold text-lg">{profile.totalWatched || 0}</p>
                <p className="text-white/40 text-xs">Watched</p>
              </div>
              <div className="text-center cursor-pointer hover:text-white/80 transition-colors" onClick={() => navigate(`/friends`)}>
                <p className="font-bold text-lg">{followerCount}</p>
                <p className="text-white/40 text-xs">Followers</p>
              </div>
              <div className="text-center cursor-pointer hover:text-white/80 transition-colors" onClick={() => navigate(`/friends`)}>
                <p className="font-bold text-lg">{followingCount}</p>
                <p className="text-white/40 text-xs">Following</p>
              </div>
              {compatibility !== null && (
                <div className="text-center">
                  <p className="font-bold text-lg text-primary">{compatibility}%</p>
                  <p className="text-white/40 text-xs">Taste Match</p>
                </div>
              )}
            </div>

            {/* Badges */}
            {profile.badges?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.badges.map(b => {
                  const badge = BADGE_LABELS[b]
                  if (!badge) return null
                  return (
                    <span key={b} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                  )
                })}
              </div>
            )}

            {!isOwnProfile && isSignedIn && (
              <button onClick={handleToggleFollow} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${following ? 'bg-white/5 border border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/30' : 'bg-primary hover:bg-primary-dull text-white'}`}>
                {following ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}
          </div>
        </div>

        {/* Top 4 films */}
        {profile.topFourFilms?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Favourite Films</h2>
            <div className="flex gap-3">
              {profile.topFourFilms.map(tmdbId => (
                <div key={tmdbId} className="w-24 h-36 bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => navigate(`/movies/${tmdbId}`)}>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-bold mb-5">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-white/30 text-sm">No reviews yet</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.slice(0, 10).map(r => <ReviewCard key={r._id} review={r} showMovie getToken={getToken} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
