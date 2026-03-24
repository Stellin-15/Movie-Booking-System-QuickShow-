import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String, default: '' },
  username: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  topFourFilms: { type: [Number], default: [], maxlength: 4 }, // tmdbIds
  preferences: {
    favoriteGenres: { type: [String], default: [] },
    preferredLanguages: { type: [String], default: ['en'] },
    minImdbRating: { type: Number, default: 0 }
  },
  badges: { type: [String], default: [] },
  watchStreak: { type: Number, default: 0 },
  lastWatchedDate: { type: Date },
  totalWatched: { type: Number, default: 0 },
  // Monetization
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  planExpiresAt: { type: Date },
  // AI usage tracking (for free tier gating)
  aiPicksToday: { type: Number, default: 0 },
  aiPicksResetAt: { type: Date, default: Date.now },
  // Annual Wrapped
  wrapped: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
})

// Reset daily AI pick count if it's a new day
userSchema.methods.canUseAI = function () {
  const now = new Date()
  const resetAt = this.aiPicksResetAt
  if (!resetAt || now.toDateString() !== resetAt.toDateString()) {
    this.aiPicksToday = 0
    this.aiPicksResetAt = now
  }
  return this.plan === 'pro' || this.aiPicksToday < 5
}

userSchema.methods.incrementAIPicks = async function () {
  this.aiPicksToday += 1
  await this.save()
}

export default mongoose.model('User', userSchema)
