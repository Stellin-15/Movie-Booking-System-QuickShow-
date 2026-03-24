import { create } from 'zustand'
import { getMe, syncUser, updateMe } from '../api/users.js'

const useUserStore = create((set, get) => ({
  profile: null,
  loading: false,

  sync: async (getToken, clerkUser) => {
    if (!clerkUser) return
    set({ loading: true })
    try {
      const profile = await syncUser(getToken, {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName,
        avatar: clerkUser.imageUrl
      })
      set({ profile, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchProfile: async (getToken) => {
    set({ loading: true })
    try {
      const profile = await getMe(getToken)
      set({ profile, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  updateProfile: async (getToken, data) => {
    const updated = await updateMe(getToken, data)
    set({ profile: updated })
    return updated
  },

  isPro: () => get().profile?.plan === 'pro',

  clear: () => set({ profile: null })
}))

export default useUserStore
