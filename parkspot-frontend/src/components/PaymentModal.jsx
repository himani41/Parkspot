import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from '../config/stripe'
import CheckoutForm from './CheckoutForm'
import {
	cancelPending,
	dismissPending,
	fetchActiveSession,
	fetchZones,
} from '../features/zones/zonesSlice'
import { formatCost } from '../utils/formatCost'

export default function PaymentModal({ pending }) {
	const dispatch = useDispatch()
	const { session, clientSecret } = pending
	const [paid, setPaid] = useState(false)
	const [timedOut, setTimedOut] = useState(false)
	const [error, setError] = useState('')

	// After Stripe confirms the card, our webhook activates the session a moment later.
	// Poll until the backend says ACTIVE.
	useEffect(() => {
		if (!paid) return
		let tries = 0
		const id = setInterval(() => {
			tries += 1
			dispatch(fetchActiveSession())
			if (tries >= 20) {
				clearInterval(id)
				setTimedOut(true)
			}
		}, 1000)
		return () => clearInterval(id)
	}, [paid, dispatch])

	const handleCancel = async () => {
		setError('')
		try {
			await dispatch(cancelPending(session.id)).unwrap()
			dispatch(fetchZones())
		} catch (message) {
			setError(message)
		}
	}

	const handlePaid = () => {
		setPaid(true)
		dispatch(fetchZones())
	}

	return (
		<div className='fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4'>
			<div className='bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4'>
				<h2 className='text-xl font-bold'>Complete your booking</h2>
				<p className='text-sm text-gray-700'>
					{session.zoneName} &middot; {session.plate}
				</p>
				<p className='text-sm text-gray-700'>
					{session.durationMinutes} minutes &middot;{' '}
					{formatCost(session.costCents)}
				</p>

				{paid ? (
					<div className='space-y-3'>
						<p className='font-medium'>
							Payment received. Activating your session...
						</p>
						{timedOut && (
							<>
								<p className='text-sm text-yellow-700'>
									This is taking longer than expected. Your
									payment went through, so check &ldquo;My
									sessions&rdquo; in a moment.
								</p>
								<button
									onClick={() => dispatch(dismissPending())}
									className='w-full bg-gray-800 text-white py-2 rounded'
								>
									Close
								</button>
							</>
						)}
					</div>
				) : clientSecret ? (
					<>
						<p className='text-xs text-gray-500'>
							Your spot is held for 5 minutes.
						</p>
						<Elements
							key={clientSecret}
							stripe={stripePromise}
							options={{ clientSecret }}
						>
							<CheckoutForm
								amountLabel={formatCost(session.costCents)}
								onPaid={handlePaid}
							/>
						</Elements>
					</>
				) : (
					<p className='text-sm text-gray-700'>
						This booking is waiting for payment, but the card form
						can&apos;t be restored after a refresh. Cancel it and
						book again.
					</p>
				)}

				{error && <p className='text-red-600 text-sm'>{error}</p>}

				{!paid && (
					<button
						onClick={handleCancel}
						className='w-full border border-gray-400 text-gray-700 py-2 rounded'
					>
						Cancel booking
					</button>
				)}
			</div>
		</div>
	)
}
