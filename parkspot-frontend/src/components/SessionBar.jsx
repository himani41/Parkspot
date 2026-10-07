import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
	fetchZones,
	leaveSession,
	clearSession,
} from '../features/zones/zonesSlice'

export default function SessionBar({ session }) {
	const dispatch = useDispatch()
	const [remainingMs, setRemainingMs] = useState(
		() => new Date(session.endTime) - Date.now()
	)
	const [error, setError] = useState('')

	useEffect(() => {
		const timer = setInterval(() => {
			const remaining = new Date(session.endTime) - Date.now()
			setRemainingMs(remaining)
			if (remaining <= 0) {
				clearInterval(timer)
				dispatch(clearSession())
				dispatch(fetchZones())
			}
		}, 1000)
		return () => clearInterval(timer)
	}, [session.endTime, dispatch])

	const handleLeave = async () => {
		setError('')
		try {
			await dispatch(leaveSession(session.id)).unwrap()
			dispatch(fetchZones())
		} catch (message) {
			setError(message)
		}
	}

	const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
	const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
	const secs = String(totalSeconds % 60).padStart(2, '0')
	const fiveMinWarning = totalSeconds <= 300

	return (
		<div
			className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] rounded-lg shadow-lg px-5 py-3 flex items-center gap-4
                     ${
							fiveMinWarning
								? 'bg-yellow-100 border border-yellow-500'
								: 'bg-white'
						}`}
		>
			<div>
				<p className='text-xs text-gray-500'>Time remaining</p>
				<p className='text-2xl font-mono font-bold'>
					{mins}:{secs}
				</p>
				{fiveMinWarning && (
					<p className='text-xs text-yellow-700 font-medium'>
						Less than 5 minutes left!
					</p>
				)}
				{error && <p className='text-xs text-red-600'>{error}</p>}
			</div>
			<button
				onClick={handleLeave}
				className='bg-red-600 text-white px-4 py-2 rounded'
			>
				End session
			</button>
		</div>
	)
}
