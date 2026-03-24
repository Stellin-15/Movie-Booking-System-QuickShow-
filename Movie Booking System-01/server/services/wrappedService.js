import User from '../models/User.js'
import LibraryItem from '../models/LibraryItem.js'
import Review from '../models/Review.js'

export async function generateWrapped(targetYear) {
  const year = targetYear || new Date().getFullYear() - 1
  const start = new Date(`${year}-01-01`)
  const end = new Date(`${year}-12-31T23:59:59`)

  const users = await User.find({})
  let processed = 0

  for (const user of users) {
    try {
      const [watched, reviews] = await Promise.all([
        LibraryItem.find({ clerkId: user.clerkId, status: { $in: ['watched', 'rewatching'] }, watchedAt: { $gte: start, $lte: end } }),
        Review.find({ clerkId: user.clerkId, createdAt: { $gte: start, $lte: end } })
      ])

      if (watched.length === 0) continue

      const genreCount = {}
      let totalRuntime = 0
      for (const item of watched) {
        totalRuntime += item.runtime || 0
        for (const g of item.genres || []) {
          genreCount[g] = (genreCount[g] || 0) + 1
        }
      }

      const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0]
      const sorted = watched.sort((a, b) => new Date(a.watchedAt) - new Date(b.watchedAt))
      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null

      user.wrapped = {
        year,
        totalMovies: watched.length,
        totalHours: Math.round(totalRuntime / 60),
        topGenre,
        genreBreakdown: genreCount,
        firstMovie: sorted[0] ? { title: sorted[0].title, date: sorted[0].watchedAt } : null,
        lastMovie: sorted[sorted.length - 1] ? { title: sorted[sorted.length - 1].title, date: sorted[sorted.length - 1].watchedAt } : null,
        totalReviews: reviews.length,
        avgRating,
        generatedAt: new Date()
      }

      await user.save()
      processed++
    } catch (err) {
      console.error(`Wrapped failed for user ${user.clerkId}:`, err.message)
    }
  }

  console.log(`Annual Wrapped generated for ${processed} users`)
}
