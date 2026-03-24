import axios from 'axios'

const NEWS_BASE = 'https://newsapi.org/v2'

export async function getMovieNews(page = 1, pageSize = 20) {
  try {
    const { data } = await axios.get(`${NEWS_BASE}/everything`, {
      params: {
        q: 'movie OR film OR cinema OR Hollywood OR trailer',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize,
        page,
        apiKey: process.env.NEWS_API_KEY
      }
    })
    return data.articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      imageUrl: a.urlToImage,
      source: a.source.name,
      publishedAt: a.publishedAt
    }))
  } catch {
    return []
  }
}

export async function getTrailerNews() {
  try {
    const { data } = await axios.get(`${NEWS_BASE}/everything`, {
      params: {
        q: 'trailer official release 2025',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 10,
        apiKey: process.env.NEWS_API_KEY
      }
    })
    return data.articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      imageUrl: a.urlToImage,
      source: a.source.name,
      publishedAt: a.publishedAt
    }))
  } catch {
    return []
  }
}
