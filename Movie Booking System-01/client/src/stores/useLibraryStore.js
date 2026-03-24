import { create } from 'zustand'
import { getLibrary, addToLibrary, updateLibraryItem, removeFromLibrary } from '../api/library.js'
import toast from 'react-hot-toast'

const useLibraryStore = create((set, get) => ({
  items: [],
  loaded: false,

  fetchLibrary: async (getToken) => {
    try {
      const items = await getLibrary(getToken)
      set({ items, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  addItem: async (getToken, movie, status) => {
    try {
      const { item, newBadges } = await addToLibrary(getToken, { ...movie, status })
      set(s => {
        const filtered = s.items.filter(i => i.tmdbId !== movie.tmdbId)
        return { items: [item, ...filtered] }
      })
      toast.success(`Added to ${status === 'watched' ? 'Watched' : status === 'watchlist' ? 'Watchlist' : status}`)
      if (newBadges?.length > 0) {
        newBadges.forEach(b => toast.success(`🏆 Badge unlocked: ${b.replace(/_/g, ' ')}`, { duration: 4000 }))
      }
      return { item, newBadges }
    } catch (err) {
      if (err.status === 402) {
        toast.error('Library full — upgrade to Pro for unlimited')
        throw err
      }
      toast.error('Failed to add to library')
      throw err
    }
  },

  updateItem: async (getToken, tmdbId, data) => {
    try {
      const updated = await updateLibraryItem(getToken, tmdbId, data)
      set(s => ({ items: s.items.map(i => i.tmdbId === tmdbId ? updated : i) }))
      return updated
    } catch {
      toast.error('Failed to update')
    }
  },

  removeItem: async (getToken, tmdbId) => {
    try {
      await removeFromLibrary(getToken, tmdbId)
      set(s => ({ items: s.items.filter(i => i.tmdbId !== tmdbId) }))
      toast.success('Removed from library')
    } catch {
      toast.error('Failed to remove')
    }
  },

  getStatus: (tmdbId) => {
    const item = get().items.find(i => i.tmdbId === tmdbId)
    return item?.status || null
  },

  getRating: (tmdbId) => {
    const item = get().items.find(i => i.tmdbId === tmdbId)
    return item?.userRating || null
  },

  getByStatus: (status) => get().items.filter(i => i.status === status),

  clear: () => set({ items: [], loaded: false })
}))

export default useLibraryStore
