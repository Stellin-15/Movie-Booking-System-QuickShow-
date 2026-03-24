import React, { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(null)
  const display = hovered ?? value
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => !readOnly && setHovered(null)}>
      {[1, 2, 3, 4, 5].map(star => {
        const full = display >= star
        const half = display >= star - 0.5 && display < star
        return (
          <div key={star} className={`relative ${readOnly ? '' : 'cursor-pointer'}`}>
            {/* Half star detection */}
            {!readOnly && (
              <>
                <div className="absolute left-0 top-0 w-1/2 h-full z-10"
                  onMouseEnter={() => setHovered(star - 0.5)}
                  onClick={() => onChange?.(star - 0.5)} />
                <div className="absolute right-0 top-0 w-1/2 h-full z-10"
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => onChange?.(star)} />
              </>
            )}
            <Star
              className={`${starSize} transition-colors ${
                full ? 'text-yellow-400 fill-yellow-400' :
                half ? 'text-yellow-400 fill-yellow-200' :
                'text-white/20'
              }`}
            />
          </div>
        )
      })}
      {value > 0 && (
        <span className="ml-1 text-sm text-white/60">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
