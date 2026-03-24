import LibraryItem from '../models/LibraryItem.js'
import Review from '../models/Review.js'

// Build a taste profile from user's watched library + reviews
export async function buildTasteProfile(clerkId) {
  const [watched, reviews] = await Promise.all([
    LibraryItem.find({ clerkId, status: { $in: ['watched', 'rewatching'] } }),
    Review.find({ clerkId })
  ])

  if (watched.length === 0) return { genres: {}, avgRating: null, totalWatched: 0, topGenres: [] }

  // Aggregate genre scores weighted by user rating
  const genreScores = {}
  for (const item of watched) {
    const weight = item.userRating || 3 // default neutral weight
    for (const genre of item.genres || []) {
      genreScores[genre] = (genreScores[genre] || 0) + weight
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : null

  // Sort genres by score
  const topGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre)

  // Decade preference
  const decadeMap = {}
  for (const item of watched) {
    if (item.releaseYear) {
      const decade = Math.floor(item.releaseYear / 10) * 10
      decadeMap[decade] = (decadeMap[decade] || 0) + 1
    }
  }

  return {
    genres: genreScores,
    topGenres,
    avgRating,
    totalWatched: watched.length,
    preferredDecades: Object.entries(decadeMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => parseInt(d)),
    recentlyWatched: watched
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, 10)
      .map(i => ({ tmdbId: i.tmdbId, title: i.title, rating: i.userRating }))
  }
}

// Compute compatibility score between two users (0–100)
export async function computeCompatibility(clerkIdA, clerkIdB) {
  const [reviewsA, reviewsB] = await Promise.all([
    Review.find({ clerkId: clerkIdA }),
    Review.find({ clerkId: clerkIdB })
  ])

  const mapA = Object.fromEntries(reviewsA.map(r => [r.tmdbId, r.rating]))
  const mapB = Object.fromEntries(reviewsB.map(r => [r.tmdbId, r.rating]))

  const shared = Object.keys(mapA).filter(id => mapB[id] !== undefined)
  if (shared.length === 0) return 0

  // Pearson-like: average delta between ratings on shared films
  const totalDelta = shared.reduce((sum, id) => sum + Math.abs(mapA[id] - mapB[id]), 0)
  const avgDelta = totalDelta / shared.length
  const maxDelta = 4.5 // max possible difference on 0.5–5 scale
  const score = Math.round((1 - avgDelta / maxDelta) * 100)

  return Math.max(0, Math.min(100, score))
}

// Check badge eligibility and return new badges earned
export async function checkBadges(clerkId, user) {
  const newBadges = []
  const existing = new Set(user.badges || [])

  const [watchedCount, reviewCount, listCount, followerCount] = await Promise.all([
    LibraryItem.countDocuments({ clerkId, status: { $in: ['watched', 'rewatching'] } }),
    Review.countDocuments({ clerkId }),
    import('../models/CineList.js').then(m => m.default.countDocuments({ ownerId: clerkId })),
    import('../models/Follow.js').then(m => m.default.countDocuments({ followingId: clerkId }))
  ])

  if (watchedCount >= 100 && !existing.has('century_club')) newBadges.push('century_club')
  if (watchedCount >= 1 && !existing.has('first_watch')) newBadges.push('first_watch')
  if (reviewCount >= 1 && !existing.has('first_review')) newBadges.push('first_review')
  if (listCount >= 1 && !existing.has('list_maker')) newBadges.push('list_maker')
  if (followerCount >= 10 && !existing.has('social_butterfly')) newBadges.push('social_butterfly')

  return newBadges
}
