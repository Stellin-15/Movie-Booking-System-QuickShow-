import React from 'react'

export default function GenrePill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
        active
          ? 'bg-primary border-primary text-white'
          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'
      }`}
    >
      {label}
    </button>
  )
}
