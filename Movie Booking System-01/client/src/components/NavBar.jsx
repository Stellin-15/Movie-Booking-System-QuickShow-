import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser, useClerk, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { MenuIcon, XIcon, SearchIcon, Film, BookOpen, Users, Clapperboard } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Movies', path: '/movies' },
  { label: 'Discover', path: '/discover', authRequired: true },
  { label: 'Lists', path: '/lists' },
  { label: 'Feed', path: '/feed', authRequired: true },
]

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleNavClick = (link) => {
    if (link.authRequired && !isSignedIn) { openSignIn(); return }
    navigate(link.path)
    setIsOpen(false)
    window.scrollTo(0, 0)
  }

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 bg-black/80 backdrop-blur-md border-b border-white/5">
      {/* Logo */}
      <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2">
        <Clapperboard className="w-6 h-6 text-primary" />
        <span className="text-xl font-bold tracking-tight text-white">Cine<span className="text-primary">AI</span></span>
      </Link>

      {/* Desktop nav */}
      <ul className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(link => (
          <li key={link.path}>
            <button
              onClick={() => handleNavClick(link)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive(link.path) ? 'bg-primary/20 text-primary' : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button onClick={() => { navigate('/search'); setIsOpen(false) }} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
          <SearchIcon className="w-5 h-5" />
        </button>

        <SignedOut>
          <button onClick={() => openSignIn()} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dull text-white rounded-full transition-all">
            Sign In
          </button>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/">
            <UserButton.MenuItems>
              <UserButton.Action label="My Library" labelIcon={<BookOpen width={15} />} onClick={() => navigate('/library')} />
              <UserButton.Action label="Friends" labelIcon={<Users width={15} />} onClick={() => navigate('/friends')} />
              <UserButton.Action label="Marathon Room" labelIcon={<Film width={15} />} onClick={() => navigate('/marathon')} />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>

        <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setIsOpen(o => !o)}>
          {isOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 py-2">
          {NAV_LINKS.map(link => (
            <button key={link.path} onClick={() => handleNavClick(link)} className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors ${isActive(link.path) ? 'text-primary' : 'text-white/70 hover:text-white'}`}>
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default NavBar
