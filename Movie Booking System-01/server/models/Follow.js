import mongoose from 'mongoose'

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true }, // who follows
  followingId: { type: String, required: true }, // who is followed
  createdAt: { type: Date, default: Date.now }
})

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true })
followSchema.index({ followingId: 1 })

export default mongoose.model('Follow', followSchema)
