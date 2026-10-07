import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Client } from '@stomp/stompjs'
import { WS_URL } from '../config/constants'
import { fetchZones, zoneUpdated } from '../features/zones/zonesSlice'

export default function useZoneStream() {
	const dispatch = useDispatch()

	useEffect(() => {
		const client = new Client({
			brokerURL: WS_URL,
			reconnectDelay: 5000, // retry automatically if the connection drops
			onConnect: () => {
				dispatch(fetchZones()) // catch up on anything missed while disconnected
				client.subscribe('/topic/zones', (message) => {
					dispatch(zoneUpdated(JSON.parse(message.body)))
				})
			},
		})

		client.activate()
		return () => client.deactivate() // close the socket when leaving the page
	}, [dispatch])
}
