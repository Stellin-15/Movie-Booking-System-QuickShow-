import { apiFetch } from './http.js'

export const recommend = (getToken, payload) =>
  apiFetch('/api/agent/recommend', { method: 'POST', body: JSON.stringify(payload) }, getToken)

export const getUsage = (getToken) => apiFetch('/api/agent/usage', {}, getToken)
