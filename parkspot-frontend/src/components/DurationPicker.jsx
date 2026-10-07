import {
	MIN_DURATION_MINUTES as MIN,
	MAX_DURATION_MINUTES as MAX,
	DURATION_STEP,
} from '../config/constants'
import { formatDuration } from '../utils/formatDuration'

const QUICK_ADDS = [
	{ label: '+15 min', minutes: 15 },
	{ label: '+30 min', minutes: 30 },
	{ label: '+1 hr', minutes: 60 },
]

export default function DurationPicker({ value, onChange }) {
	const set = (n) => onChange(Math.min(MAX, Math.max(MIN, n)))

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<button
					type='button'
					onClick={() => set(value - DURATION_STEP)}
					disabled={value <= MIN}
					aria-label='Decrease time'
					className='w-9 h-9 rounded-full border text-lg disabled:opacity-40'
				>
					−
				</button>
				<span className='text-lg font-semibold'>
					{formatDuration(value)}
				</span>
				<button
					type='button'
					onClick={() => set(value + DURATION_STEP)}
					disabled={value >= MAX}
					aria-label='Increase time'
					className='w-9 h-9 rounded-full border text-lg disabled:opacity-40'
				>
					+
				</button>
			</div>

			<div className='flex gap-1'>
				{QUICK_ADDS.map((q) => (
					<button
						key={q.label}
						type='button'
						onClick={() => set(value + q.minutes)}
						disabled={value >= MAX}
						className='flex-1 border rounded px-1 py-1 text-xs disabled:opacity-40'
					>
						{q.label}
					</button>
				))}
			</div>

			<p className='text-xs text-gray-500'>
				Min {formatDuration(MIN)}, max {formatDuration(MAX)}
			</p>
		</div>
	)
}
