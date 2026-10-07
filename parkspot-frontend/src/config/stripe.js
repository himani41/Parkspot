import { loadStripe } from '@stripe/stripe-js'

// Created once, outside any component, so Stripe.js isn't reloaded on every render
export const stripePromise = loadStripe(
	import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)
