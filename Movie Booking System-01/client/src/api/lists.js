import { apiFetch } from './http.js'

export const getLists = (page = 1) => apiFetch(`/api/lists?page=${page}`)
export const getMyLists = (getToken) => apiFetch('/api/lists/mine', {}, getToken)
export const getList = (id) => apiFetch(`/api/lists/${id}`)
export const createList = (getToken, data) => apiFetch('/api/lists', { method: 'POST', body: JSON.stringify(data) }, getToken)
export const addMovieToList = (getToken, listId, movie) => apiFetch(`/api/lists/${listId}/movies`, { method: 'POST', body: JSON.stringify(movie) }, getToken)
export const removeMovieFromList = (getToken, listId, tmdbId) => apiFetch(`/api/lists/${listId}/movies/${tmdbId}`, { method: 'DELETE' }, getToken)
export const forkList = (getToken, listId) => apiFetch(`/api/lists/${listId}/fork`, { method: 'POST' }, getToken)
export const saveList = (getToken, listId) => apiFetch(`/api/lists/${listId}/save`, { method: 'POST' }, getToken)
export const deleteList = (getToken, listId) => apiFetch(`/api/lists/${listId}`, { method: 'DELETE' }, getToken)
