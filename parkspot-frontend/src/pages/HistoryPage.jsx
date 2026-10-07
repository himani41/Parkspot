import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import { formatCost } from '../utils/formatCost'
import UserBadge from '../components/UserBadge'

export default function HistoryPage() {
	const [sessions, setSessions] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		api.get('/sessions')
			.then((res) => setSessions(res.data))
			.catch((err) =>
				setError(err.response?.data?.error || 'Could not load sessions')
			)
			.finally(() => setLoading(false))
	}, [])

	return (
		<div className='min-h-screen bg-gray-100'>
			<header className='bg-gray-900 text-white px-4 py-3 flex items-center justify-between'>
				<h1 className='font-bold'>My sessions</h1>
				<div className='flex items-center gap-4'>
					<UserBadge />
					<Link
						to='/'
						className='bg-gray-700 px-3 py-1 rounded text-sm'
					>
						Back to map
					</Link>
				</div>
			</header>

			<main className='max-w-2xl mx-auto p-4 space-y-3'>
				{loading && <p>Loading...</p>}
				{error && <p className='text-red-600'>{error}</p>}
				{!loading && !error && sessions.length === 0 && (
					<p className='text-gray-600'>No parking sessions yet.</p>
				)}

				{sessions.map((s) => (
					<div
						key={s.id}
						className='bg-white rounded-lg shadow p-4 flex justify-between items-center'
					>
						<div>
							{s.zoneName && (
								<p className='text-sm text-gray-700'>
									{s.zoneName} &middot; {s.plate}
								</p>
							)}
							<p className='font-medium'>
								{new Date(s.startTime).toLocaleString()}
							</p>
							<p className='text-sm text-gray-600'>
								{s.status === 'ACTIVE'
									? 'In progress'
									: `Ended ${new Date(
											s.endedAt ?? s.endTime
									  ).toLocaleTimeString()}`}
							</p>
						</div>
						<div className='text-right'>
							<p className='font-semibold'>
								{formatCost(s.costCents)}
							</p>
							<p className='text-xs text-green-700'>Paid</p>
						</div>
					</div>
				))}
			</main>
		</div>
	)
}
