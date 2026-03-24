import express from 'express'
import Stripe from 'stripe'
import User from '../models/User.js'
import { requireAuth } from '../middleware/clerkAuth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID // set in .env

const router = express.Router()

// POST /api/billing/create-checkout — create Stripe checkout session
router.post('/create-checkout', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { clerkId: req.clerkId } })
      customerId = customer.id
      user.stripeCustomerId = customerId
      await user.save()
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/library?upgrade=success`,
      cancel_url: `${process.env.CLIENT_URL}/library?upgrade=cancelled`,
      metadata: { clerkId: req.clerkId }
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/billing/portal — Stripe customer portal
router.get('/portal', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId })
    if (!user?.stripeCustomerId) return res.status(400).json({ error: 'No billing account found' })

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/library`
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/billing/webhook — Stripe webhook (raw body mounted before json middleware in index.js)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const session = event.data.object
  const clerkId = session.metadata?.clerkId

  switch (event.type) {
    case 'checkout.session.completed':
      if (clerkId) {
        await User.findOneAndUpdate({ clerkId }, {
          plan: 'pro',
          stripeSubscriptionId: session.subscription,
          planExpiresAt: null
        })
      }
      break

    case 'customer.subscription.deleted':
    case 'customer.subscription.paused': {
      const subscription = session
      const customer = await stripe.customers.retrieve(subscription.customer)
      const cId = customer.metadata?.clerkId
      if (cId) await User.findOneAndUpdate({ clerkId: cId }, { plan: 'free', stripeSubscriptionId: null })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = session
      const sub = await stripe.subscriptions.retrieve(invoice.subscription)
      const cust = await stripe.customers.retrieve(sub.customer)
      const cId = cust.metadata?.clerkId
      if (cId) await User.findOneAndUpdate({ clerkId: cId }, { plan: 'pro', planExpiresAt: new Date(sub.current_period_end * 1000) })
      break
    }
  }

  res.json({ received: true })
})

export default router
