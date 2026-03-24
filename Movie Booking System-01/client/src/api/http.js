const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function apiFetch(path, options = {}, getToken) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (getToken) {
    const token = await getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const error = new Error(err.message || err.error || 'Request failed')
    error.status = res.status
    error.data = err
    throw error
  }
  return res.json()
}
