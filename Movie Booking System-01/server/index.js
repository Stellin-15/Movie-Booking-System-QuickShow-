import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cron from 'node-cron'

import moviesRouter from './routes/movies.js'
import libraryRouter from './routes/library.js'
import usersRouter from './routes/users.js'
import reviewsRouter from './routes/reviews.js'
import listsRouter from './routes/lists.js'
import socialRouter from './routes/social.js'
import agentRouter from './routes/agent.js'
import marathonRouter from './routes/marathon.js'
import newsRouter from './routes/news.js'
import billingRouter from './routes/billing.js'
import { initMarathonSocket } from './sockets/marathonSocket.js'
import { generateWrapped } from './services/wrappedService.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
})

// Stripe webhook needs raw body — mount before json middleware
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/api/movies', moviesRouter)
app.use('/api/library', libraryRouter)
app.use('/api/users', usersRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/lists', listsRouter)
app.use('/api/social', socialRouter)
app.use('/api/agent', agentRouter)
app.use('/api/marathon', marathonRouter)
app.use('/api/news', newsRouter)
app.use('/api/billing', billingRouter)

// Socket.io
initMarathonSocket(io)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// Annual Wrapped cron — runs Dec 1st at midnight
cron.schedule('0 0 1 12 *', () => {
  console.log('Running Annual Wrapped generation...')
  generateWrapped()
})

// MongoDB + server start
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected')
    httpServer.listen(process.env.PORT || 5000, () => {
      console.log(`CineAI server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
