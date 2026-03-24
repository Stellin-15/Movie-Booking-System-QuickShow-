import React, { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useAuth, useUser, useClerk } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'

import Navbar from './components/NavBar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import Discover from './pages/Discover'
import Library from './pages/Library'
import Feed from './pages/Feed'
import Lists from './pages/Lists'
import ListDetail from './pages/ListDetail'
import Profile from './pages/Profile'
import Friends from './pages/Friends'
import Marathon from './pages/Marathon'
import MarathonRoom from './pages/MarathonRoom'
import Search from './pages/Search'

import useUserStore from './stores/useUserStore'
import useLibraryStore from './stores/useLibraryStore'

// Protected route wrapper
function Protected({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  const { openSignIn } = useClerk()

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) openSignIn()
  }, [isLoaded, isSignedIn])

  if (!isLoaded) return null
  if (!isSignedIn) return null
  return children
}

export const App = () => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const { getToken, isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const syncUser = useUserStore(s => s.sync)
  const fetchLibrary = useLibraryStore(s => s.fetchLibrary)
  const clearUser = useUserStore(s => s.clear)
  const clearLibrary = useLibraryStore(s => s.clear)

  // Sync user to MongoDB on sign-in
  useEffect(() => {
    if (isSignedIn && clerkUser) {
      syncUser(getToken, clerkUser)
      fetchLibrary(getToken)
    } else if (!isSignedIn) {
      clearUser()
      clearLibrary()
    }
  }, [isSignedIn, clerkUser])

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#f0f0f0', border: '1px solid #333' } }} />
      {!isAdminRoute && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/lists/:id" element={<ListDetail />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/search" element={<Search />} />

        {/* Auth required */}
        <Route path="/feed" element={<Protected><Feed /></Protected>} />
        <Route path="/discover" element={<Protected><Discover /></Protected>} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/friends" element={<Protected><Friends /></Protected>} />
        <Route path="/marathon" element={<Protected><Marathon /></Protected>} />
        <Route path="/marathon/:roomCode" element={<Protected><MarathonRoom /></Protected>} />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  )
}

export default App
