import { useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

export default function CheckoutForm({ amountLabel, onPaid }) {
	const stripe = useStripe()
	const elements = useElements()
	const [error, setError] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (!stripe || !elements) return

		setSubmitting(true)
		setError('')

		// Card details go straight from Stripe's iframe to Stripe, never through our code
		const { error: stripeError } = await stripe.confirmPayment({
			elements,
			redirect: 'if_required', // cards don't redirect, so we stay on the page
		})

		if (stripeError) {
			setError(stripeError.message)
			setSubmitting(false)
			return
		}
		onPaid()
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-4'>
			<PaymentElement />
			{error && <p className='text-red-600 text-sm'>{error}</p>}
			<button
				disabled={!stripe || submitting}
				className='w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400'
			>
				{submitting ? 'Processing...' : `Pay ${amountLabel}`}
			</button>
		</form>
	)
}
