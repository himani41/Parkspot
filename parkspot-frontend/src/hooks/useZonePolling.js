import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchZones } from '../features/zones/zonesSlice'
import { POLL_MS } from '../config/constants'

export default function useZonePolling() {
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(fetchZones())
		const interval = setInterval(() => dispatch(fetchZones()), POLL_MS)
		return () => clearInterval(interval)
	}, [dispatch])
}
