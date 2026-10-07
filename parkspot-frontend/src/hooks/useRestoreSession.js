import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchActiveSession } from '../features/zones/zonesSlice'

export default function useRestoreSession() {
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(fetchActiveSession())
	}, [dispatch])
}
