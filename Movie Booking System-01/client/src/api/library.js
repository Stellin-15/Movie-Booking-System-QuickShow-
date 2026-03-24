import { apiFetch } from './http.js'

export const getLibrary = (getToken, status) =>
  apiFetch(`/api/library${status ? `?status=${status}` : ''}`, {}, getToken)

export const addToLibrary = (getToken, data) =>
  apiFetch('/api/library', { method: 'POST', body: JSON.stringify(data) }, getToken)

export const updateLibraryItem = (getToken, tmdbId, data) =>
  apiFetch(`/api/library/${tmdbId}`, { method: 'PUT', body: JSON.stringify(data) }, getToken)

export const removeFromLibrary = (getToken, tmdbId) =>
  apiFetch(`/api/library/${tmdbId}`, { method: 'DELETE' }, getToken)

export const getLibraryStats = (getToken) =>
  apiFetch('/api/library/stats', {}, getToken)
