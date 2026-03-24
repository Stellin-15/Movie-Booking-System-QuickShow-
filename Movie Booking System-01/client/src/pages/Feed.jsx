import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { Star, List, Eye, Newspaper, RefreshCw } from 'lucide-react'
import useSocialStore from '../stores/useSocialStore'
import { apiFetch } from '../api/http'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92'

function FeedItem({ item, navigate }) {
  const time = new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (item.type === 'watched') return (
    <div className="flex gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/15 transition-all">
      {item.posterPath && (
        <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title} onClick={() => navigate(`/movies/${item.tmdbId}`)}
          className="w-12 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition" />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.user?.name || item.user?.username}</span>
          <span className="text-xs text-white/30">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-white/60">
          <Eye className="w-4 h-4 text-green-400" />
          <span>watched</span>
          <span className="text-white font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/movies/${item.tmdbId}`)}>{item.title}</span>
        </div>
        {item.rating && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-white/50">{item.rating}/5</span>
          </div>
        )}
      </div>
    </div>
  )

  if (item.type === 'review') return (
    <div className="flex gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/15 transition-all">
      {item.posterPath && (
        <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title} onClick={() => navigate(`/movies/${item.tmdbId}`)}
          className="w-12 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition" />
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.user?.name || item.user?.username}</span>
          <span className="text-xs text-white/30">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-white/60 mb-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>reviewed</span>
          <span className="text-white font-medium cursor-pointer hover:text-primary" onClick={() => navigate(`/movies/${item.tmdbId}`)}>{item.title}</span>
          {item.rating && <span className="text-yellow-400 font-medium">{item.rating}★</span>}
        </div>
        {item.body && <p className="text-xs text-white/50 line-clamp-2">{item.body}</p>}
        {item.tags?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.tags.map(t => <span key={t} className="text-xs text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded-full">#{t}</span>)}
          </div>
        )}
      </div>
    </div>
  )

  if (item.type === 'list') return (
    <div className="flex gap-4 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/15 transition-all cursor-pointer"
      onClick={() => navigate(`/lists/${item.listId}`)}>
      <div className="w-12 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <List className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.user?.name || item.user?.username}</span>
          <span className="text-xs text-white/30">{time}</span>
        </div>
        <p className="text-sm text-white/60">created a new list: <span className="text-white font-medium">{item.title}</span></p>
        <p className="text-xs text-white/30 mt-1">{item.movieCount} movies</p>
      </div>
    </div>
  )

  return null
}

export default function Feed() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { feed, feedHasMore, fetchFeed, fetchSuggestions, suggestions } = useSocialStore()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFeed(getToken, true)
    fetchSuggestions(getToken)
    apiFetch('/api/news?type=trailers').then(setNews).catch(() => {})
  }, [])

  const loadMore = async () => {
    setLoading(true)
    await fetchFeed(getToken)
    setLoading(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-8">
          {/* Main feed */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>

            {feed.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg mb-3">Your feed is empty</p>
                <p className="text-white/20 text-sm mb-6">Follow people to see their activity here</p>
                <button onClick={() => navigate('/friends')} className="px-5 py-2.5 bg-primary hover:bg-primary-dull rounded-full text-sm font-semibold transition-all">
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {feed.map((item, i) => <FeedItem key={i} item={item} navigate={navigate} />)}
                {feedHasMore && (
                  <button onClick={loadMore} disabled={loading} className="w-full py-3 text-sm text-white/40 hover:text-white transition-colors">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            {/* Friend suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold mb-4">People to Follow</h3>
                <div className="flex flex-col gap-3">
                  {suggestions.slice(0, 4).map(user => (
                    <div key={user.clerkId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {user.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{user.name}</p>
                        <p className="text-xs text-white/30">@{user.username}</p>
                      </div>
                      <button onClick={() => navigate(`/profile/${user.username}`)} className="text-xs text-primary hover:text-primary/70 transition-colors flex-shrink-0">View</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/friends')} className="mt-4 text-xs text-white/30 hover:text-white transition-colors">See all →</button>
              </div>
            )}

            {/* Movie news */}
            {news.length > 0 && (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Movie News</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {news.slice(0, 4).map((article, i) => (
                    <a key={i} href={article.url} target="_blank" rel="noreferrer" className="group">
                      {article.imageUrl && <img src={article.imageUrl} alt="" className="w-full h-24 object-cover rounded-xl mb-2 group-hover:opacity-80 transition" />}
                      <p className="text-xs text-white/70 group-hover:text-white transition line-clamp-2">{article.title}</p>
                      <p className="text-xs text-white/25 mt-1">{article.source}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
