export default function ZonePopup({ zone, hasActiveSession, onBook }) {
	const isFull = zone.currentCount >= zone.capacity
	const left = zone.capacity - zone.currentCount

	return (
		<div className='space-y-2 w-56'>
			<p className='font-semibold'>{zone.name}</p>
			<p className='text-sm'>
				{isFull ? (
					<span className='text-red-600 font-medium'>Full</span>
				) : (
					`${left} of ${zone.capacity} spots free`
				)}
			</p>
			{zone.meterHours && (
				<p className='text-xs text-gray-500'>{zone.meterHours}</p>
			)}

			<button
				onClick={() => onBook(zone)}
				disabled={isFull || hasActiveSession}
				className='w-full bg-blue-600 text-white rounded p-2 text-sm disabled:bg-gray-400'
			>
				{hasActiveSession
					? 'You already have a booking'
					: isFull
					? 'No spots available'
					: 'Book here'}
			</button>
		</div>
	)
}
