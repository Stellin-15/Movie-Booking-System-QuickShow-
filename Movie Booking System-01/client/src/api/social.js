import { apiFetch } from './http.js'

export const getFeed = (getToken, page = 1) => apiFetch(`/api/social/feed?page=${page}`, {}, getToken)
export const followUser = (getToken, clerkId) => apiFetch(`/api/social/follow/${clerkId}`, { method: 'POST' }, getToken)
export const getFollowers = (clerkId) => apiFetch(`/api/social/followers/${clerkId}`)
export const getFollowing = (clerkId) => apiFetch(`/api/social/following/${clerkId}`)
export const isFollowing = (getToken, clerkId) => apiFetch(`/api/social/is-following/${clerkId}`, {}, getToken)
export const getSuggestions = (getToken) => apiFetch('/api/social/suggestions', {}, getToken)
