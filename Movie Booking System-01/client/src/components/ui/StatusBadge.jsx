import React from 'react'
import { Eye, Bookmark, Play, X, RefreshCw } from 'lucide-react'

const STATUS_CONFIG = {
  watched: { label: 'Watched', icon: Eye, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  watchlist: { label: 'Watchlist', icon: Bookmark, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  watching: { label: 'Watching', icon: Play, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  dropped: { label: 'Dropped', icon: X, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  rewatching: { label: 'Rewatching', icon: RefreshCw, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  if (!status || !STATUS_CONFIG[status]) return null
  const { label, icon: Icon, color } = STATUS_CONFIG[status]
  const small = size === 'sm'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${color}`}>
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  )
}
