import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, index: true },
  tmdbId: { type: Number, required: true, index: true },
  movieTitle: { type: String, required: true },
  posterPath: { type: String, default: '' },
  rating: { type: Number, min: 0.5, max: 5 }, // half-star
  body: { type: String, maxlength: 5000 },
  isMicroReview: { type: Boolean, default: false }, // 280-char quick take
  containsSpoilers: { type: Boolean, default: false },
  tags: { type: [String], default: [] }, // #underrated #mustwatch etc
  likes: { type: [String], default: [] }, // array of clerkIds
  isRewatch: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// One review per user per movie (allow rewatches as separate entries)
reviewSchema.index({ clerkId: 1, tmdbId: 1, createdAt: -1 })

export default mongoose.model('Review', reviewSchema)
