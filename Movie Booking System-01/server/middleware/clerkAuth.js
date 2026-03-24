import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = await clerk.verifyToken(token)
    req.clerkId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Optional auth — attaches clerkId if token present, doesn't block if absent
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return next()
  const token = authHeader.split(' ')[1]
  try {
    const payload = await clerk.verifyToken(token)
    req.clerkId = payload.sub
  } catch {
    // ignore
  }
  next()
}
