import React from 'react'
import { Link } from 'react-router-dom'
import { Clapperboard, Twitter, Github, Heart } from 'lucide-react'

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 md:px-16 lg:px-24 py-12 mt-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold">Cine<span className="text-primary">AI</span></span>
          </div>
          <p className="text-xs text-white/30 max-w-xs">Your AI-powered movie social platform. Discover, track, and share your cinema journey.</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-8 text-sm text-white/40">
          <div className="flex flex-col gap-2">
            <p className="text-white/60 font-medium text-xs uppercase tracking-wider mb-1">Discover</p>
            <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
            <Link to="/discover" className="hover:text-white transition-colors">CineAI</Link>
            <Link to="/lists" className="hover:text-white transition-colors">CineLists</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-white/60 font-medium text-xs uppercase tracking-wider mb-1">Social</p>
            <Link to="/feed" className="hover:text-white transition-colors">Feed</Link>
            <Link to="/friends" className="hover:text-white transition-colors">Friends</Link>
            <Link to="/marathon" className="hover:text-white transition-colors">Marathon</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-white/60 font-medium text-xs uppercase tracking-wider mb-1">Account</p>
            <Link to="/library" className="hover:text-white transition-colors">My Library</Link>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20">
        <p>© {new Date().getFullYear()} CineAI. Movie data by TMDB. Ratings by IMDB via OMDb.</p>
        <p className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-primary" /> for film lovers</p>
      </div>
    </footer>
  )
}

export default Footer
