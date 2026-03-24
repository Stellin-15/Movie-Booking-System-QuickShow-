import mongoose from 'mongoose'

const cineListSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  collaborators: { type: [String], default: [] },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  coverMovieTmdbId: { type: Number }, // poster used as cover art
  movies: [{
    tmdbId: { type: Number, required: true },
    title: { type: String },
    posterPath: { type: String },
    addedBy: { type: String }, // clerkId
    note: { type: String, maxlength: 300 },
    rank: { type: Number } // used when isRanked=true
  }],
  isPublic: { type: Boolean, default: true },
  isRanked: { type: Boolean, default: false },
  isChallengeList: { type: Boolean, default: false },
  // Monetization — sponsored lists
  isSponsored: { type: Boolean, default: false },
  sponsorName: { type: String },
  sponsorBadge: { type: String },
  // Stats
  forkCount: { type: Number, default: 0 },
  saveCount: { type: Number, default: 0 },
  savedBy: { type: [String], default: [] }, // clerkIds who saved
  forkedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'CineList' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

cineListSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model('CineList', cineListSchema)
