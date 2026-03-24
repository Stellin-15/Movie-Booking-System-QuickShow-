import { create } from 'zustand'
import { getFeed, followUser, getSuggestions } from '../api/social.js'

const useSocialStore = create((set, get) => ({
  feed: [],
  feedPage: 1,
  feedHasMore: true,
  suggestions: [],

  fetchFeed: async (getToken, reset = false) => {
    const page = reset ? 1 : get().feedPage
    try {
      const items = await getFeed(getToken, page)
      set(s => ({
        feed: reset ? items : [...s.feed, ...items],
        feedPage: page + 1,
        feedHasMore: items.length === 20
      }))
    } catch { /* ignore */ }
  },

  toggleFollow: async (getToken, clerkId) => {
    const result = await followUser(getToken, clerkId)
    return result.following
  },

  fetchSuggestions: async (getToken) => {
    try {
      const suggestions = await getSuggestions(getToken)
      set({ suggestions })
    } catch { /* ignore */ }
  },

  prependFeedItem: (item) => set(s => ({ feed: [item, ...s.feed] })),

  clear: () => set({ feed: [], feedPage: 1, feedHasMore: true, suggestions: [] })
}))

export default useSocialStore
