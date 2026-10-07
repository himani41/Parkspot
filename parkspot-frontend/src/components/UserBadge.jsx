import useProfile from '../hooks/useProfile'

export default function UserBadge() {
	const user = useProfile()
	if (!user) return null

	return (
		<div className='flex items-center gap-2'>
			<span className='w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold'>
				{user.name?.charAt(0).toUpperCase()}
			</span>
			<span className='text-sm'>{user.name}</span>
		</div>
	)
}
