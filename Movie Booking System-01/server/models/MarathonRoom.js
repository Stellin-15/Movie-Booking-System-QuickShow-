import mongoose from 'mongoose'

const marathonRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  hostId: { type: String, required: true },
  members: { type: [String], default: [] }, // clerkIds
  candidateMovies: [{
    tmdbId: { type: Number, required: true },
    title: { type: String },
    posterPath: { type: String },
    addedBy: { type: String }, // clerkId
    votes: { type: [String], default: [] } // clerkIds who voted for this
  }],
  status: {
    type: String,
    enum: ['lobby', 'voting', 'watching', 'done'],
    default: 'lobby'
  },
  chosenMovieTmdbId: { type: Number },
  aiSuggestion: { type: Number }, // tmdbId suggested by CineAI
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24h TTL
})

export default mongoose.model('MarathonRoom', marathonRoomSchema)
