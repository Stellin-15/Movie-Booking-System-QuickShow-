import { apiFetch } from './http.js'

export const syncUser = (getToken, data) =>
  apiFetch('/api/users/sync', { method: 'POST', body: JSON.stringify(data) }, getToken)

export const getMe = (getToken) => apiFetch('/api/users/me', {}, getToken)
export const updateMe = (getToken, data) => apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }, getToken)
export const getUser = (username) => apiFetch(`/api/users/${username}`)
export const getCompatibility = (getToken, username) => apiFetch(`/api/users/${username}/compatibility`, {}, getToken)
export const getWrapped = (getToken) => apiFetch('/api/users/me/wrapped', {}, getToken)
