import mongoose from 'mongoose'

const libraryItemSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, index: true },
  tmdbId: { type: Number, required: true },
  title: { type: String, required: true },
  posterPath: { type: String, default: '' },
  backdropPath: { type: String, default: '' },
  releaseYear: { type: Number },
  genres: { type: [String], default: [] },
  runtime: { type: Number }, // minutes
  status: {
    type: String,
    enum: ['watched', 'watchlist', 'watching', 'dropped', 'rewatching'],
    required: true
  },
  userRating: { type: Number, min: 0.5, max: 5 }, // half-star 0.5–5
  rewatchCount: { type: Number, default: 0 },
  watchedAt: { type: Date },
  notes: { type: String, default: '', maxlength: 2000 }, // private diary note
  addedAt: { type: Date, default: Date.now }
})

// Compound index: one entry per user per movie
libraryItemSchema.index({ clerkId: 1, tmdbId: 1 }, { unique: true })

export default mongoose.model('LibraryItem', libraryItemSchema)
