import { useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../api/axiosInstance'
import { createBooking, fetchZones } from '../features/zones/zonesSlice'
import { RATE_CENTS_PER_MINUTE } from '../config/constants'
import { formatDuration } from '../utils/formatDuration'
import DurationPicker from './DurationPicker'

const formatCost = (cents) => `$${(cents / 100).toFixed(2)}`

export default function BookingModal({ zone, onClose }) {
	const dispatch = useDispatch()
	const [step, setStep] = useState('form') // 'form' | 'confirm'
	const [code, setCode] = useState('')
	const [plate, setPlate] = useState(localStorage.getItem('lastPlate') || '')
	const [plateState, setPlateState] = useState(
		localStorage.getItem('lastPlateState') || 'NY'
	)
	const [duration, setDuration] = useState(30)
	const [preview, setPreview] = useState(null)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const body = {
		zoneId: zone.id,
		zoneCode: code,
		plate,
		plateState,
		durationMinutes: duration,
	}
	const estimate = formatCost(duration * RATE_CENTS_PER_MINUTE)

	// "Continue": the server checks the number against THIS address, holds nothing
	const handleContinue = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			const res = await api.post('/bookings/preview', body)
			setPreview(res.data)
			setStep('confirm')
			localStorage.setItem('lastPlate', plate)
			localStorage.setItem('lastPlateState', plateState)
		} catch (err) {
			setError(
				err.response?.data?.error || 'Could not check this booking'
			)
		} finally {
			setLoading(false)
		}
	}

	// "Confirm & pay": holds the spot and creates the payment, then PaymentModal takes over
	const handleConfirm = async () => {
		setError('')
		setLoading(true)
		try {
			await dispatch(createBooking(body)).unwrap()
			dispatch(fetchZones())
			onClose()
		} catch (message) {
			setError(message)
			setLoading(false)
		}
	}

	return (
		<div className='fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4'>
			<div className='bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4'>
				<h2 className='text-xl font-bold'>
					{step === 'form' ? 'Book a spot' : 'Confirm your booking'}
				</h2>

				{step === 'form' ? (
					<form onSubmit={handleContinue} className='space-y-4'>
						<div>
							<p className='font-semibold'>{zone.name}</p>
							<p className='text-xs text-gray-500'>
								Enter the number printed on the meter pole at
								this location.
							</p>
						</div>

						<input
							className='w-full border p-2 rounded text-lg tracking-widest'
							placeholder='Pole number'
							inputMode='numeric'
							maxLength={8}
							value={code}
							onChange={(e) =>
								setCode(e.target.value.replace(/\D/g, ''))
							}
							required
						/>

						<div className='flex gap-2'>
							<input
								className='flex-1 border p-2 rounded uppercase'
								placeholder='License plate'
								maxLength={10}
								value={plate}
								onChange={(e) =>
									setPlate(e.target.value.toUpperCase())
								}
								required
							/>
							<input
								className='w-16 border p-2 rounded uppercase text-center'
								placeholder='NY'
								maxLength={2}
								value={plateState}
								onChange={(e) =>
									setPlateState(
										e.target.value
											.toUpperCase()
											.replace(/[^A-Z]/g, '')
									)
								}
								required
							/>
						</div>

						<DurationPicker
							value={duration}
							onChange={setDuration}
						/>
						<p className='text-center font-medium'>
							Estimated total: {estimate}
						</p>

						{error && (
							<p className='text-red-600 text-sm'>{error}</p>
						)}

						<div className='flex gap-2'>
							<button
								type='button'
								onClick={onClose}
								className='flex-1 border border-gray-400 py-2 rounded'
							>
								Cancel
							</button>
							<button
								disabled={loading}
								className='flex-1 bg-blue-600 text-white py-2 rounded disabled:bg-gray-400'
							>
								{loading ? 'Checking...' : 'Continue'}
							</button>
						</div>
					</form>
				) : (
					<div className='space-y-4'>
						<div className='bg-gray-50 rounded p-3 space-y-1 text-sm'>
							<p className='font-semibold text-base'>
								{preview.zoneName}
							</p>
							<p>
								Zone number:{' '}
								<span className='font-mono'>{code}</span>
							</p>
							<p>
								Spots left: {preview.spotsLeft} of{' '}
								{preview.capacity}
							</p>
							<p>
								Plate: {preview.plate} ({preview.plateState})
							</p>
							<p>
								Duration:{' '}
								{formatDuration(preview.durationMinutes)}
							</p>
							<p className='text-base font-semibold pt-1'>
								Total: {formatCost(preview.costCents)}
							</p>
						</div>

						{error && (
							<p className='text-red-600 text-sm'>{error}</p>
						)}

						<div className='flex gap-2'>
							<button
								onClick={() => {
									setError('')
									setStep('form')
								}}
								disabled={loading}
								className='flex-1 border border-gray-400 py-2 rounded'
							>
								Back
							</button>
							<button
								onClick={handleConfirm}
								disabled={loading}
								className='flex-1 bg-blue-600 text-white py-2 rounded disabled:bg-gray-400'
							>
								{loading ? 'Booking...' : 'Confirm & pay'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
