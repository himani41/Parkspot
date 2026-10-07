import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import UserBadge from './UserBadge'

export default function MapHeader() {
	const dispatch = useDispatch()

	return (
		<header className='bg-gray-900 text-white px-4 py-3 flex items-center justify-between'>
			<h1 className='font-bold'>ParkSpot NYC</h1>
			<div className='flex items-center gap-4 text-sm'>
				<span className='flex items-center gap-1'>
					<span className='inline-block w-3 h-3 rounded-full bg-green-500' />{' '}
					Available
				</span>
				<span className='flex items-center gap-1'>
					<span className='inline-block w-3 h-3 rounded-full bg-red-500' />{' '}
					Full
				</span>
				<Link to='/history' className='bg-gray-700 px-3 py-1 rounded'>
					My sessions
				</Link>
				<UserBadge />
				<button
					onClick={() => dispatch(logout())}
					className='bg-gray-700 px-3 py-1 rounded'
				>
					Log out
				</button>
			</div>
		</header>
	)
}
