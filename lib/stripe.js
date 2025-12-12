import 'server-only'

import Stripe from 'stripe'

// During build time, STRIPE_SECRET_KEY may not be available
// Use a placeholder to allow build to complete
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_placeholder_for_build'

export const stripe = new Stripe(stripeSecretKey)