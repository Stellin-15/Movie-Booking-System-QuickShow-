import axios from 'axios'

const OMDB_BASE = 'https://www.omdbapi.com'

export async function getImdbData(imdbId) {
  if (!imdbId) return null
  try {
    const { data } = await axios.get(OMDB_BASE, {
      params: { i: imdbId, apikey: process.env.OMDB_API_KEY }
    })
    if (data.Response === 'False') return null
    return {
      imdbRating: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
      imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      metascore: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : null,
      rated: data.Rated !== 'N/A' ? data.Rated : null,
      awards: data.Awards !== 'N/A' ? data.Awards : null,
      boxOffice: data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
      rottenTomatoes: data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || null
    }
  } catch {
    return null
  }
}
