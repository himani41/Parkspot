import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { NYC_CENTER, MIN_ZOOM } from '../config/constants'
import useZonePolling from '../hooks/useZonePolling'
import useZoneStream from '../hooks/useZoneStream'
import useRestoreSession from '../hooks/useRestoreSession'
import MapHeader from '../components/MapHeader'
import MapViewportWatcher from '../components/MapViewportWatcher'
import ZoneMarker from '../components/ZoneMarker'
import SessionBar from '../components/SessionBar'
import BookingModal from '../components/BookingModal'
import PaymentModal from '../components/PaymentModal'

export default function MapPage() {
	const {
		list: zones,
		status,
		error,
		activeSession,
		pending,
		viewport,
	} = useSelector((state) => state.zones)
	const [bookingZone, setBookingZone] = useState(null)
	const openBooking = useCallback((zone) => setBookingZone(zone), [])

	useZonePolling()
	useZoneStream()
	useRestoreSession()

	const zoomedOut = !viewport || viewport.zoom < MIN_ZOOM
	const hasBooking = !!activeSession || !!pending

	return (
		<div className='h-screen flex flex-col'>
			<MapHeader />

			{status === 'failed' && (
				<p className='bg-red-100 text-red-700 text-sm px-4 py-2'>
					Could not load zones: {error}
				</p>
			)}

			<div className='flex-1 relative'>
				<MapContainer
					center={NYC_CENTER}
					zoom={15}
					preferCanvas
					className='h-full w-full'
				>
					<TileLayer
						attribution='&copy; OpenStreetMap contributors'
						url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
					/>
					<MapViewportWatcher />
					{zones
						.filter(
							(zone) =>
								Number.isFinite(zone.lat) &&
								Number.isFinite(zone.lon)
						)
						.map((zone) => (
							<ZoneMarker
								key={zone.id}
								zone={zone}
								hasActiveSession={hasBooking}
								onBook={openBooking}
							/>
						))}
				</MapContainer>

				{zoomedOut && (
					<div className='absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full shadow px-4 py-2 text-sm'>
						Zoom in to see parking spots
					</div>
				)}

				{activeSession && <SessionBar session={activeSession} />}
			</div>

			{bookingZone && (
				<BookingModal
					key={bookingZone.id}
					zone={bookingZone}
					onClose={() => setBookingZone(null)}
				/>
			)}
			{pending && <PaymentModal pending={pending} />}
		</div>
	)
}
