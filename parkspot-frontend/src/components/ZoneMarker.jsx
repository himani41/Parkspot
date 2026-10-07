import { memo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import ZonePopup from './ZonePopup'

function ZoneMarker({ zone, hasActiveSession, onBook }) {
	const isFull = zone.currentCount >= zone.capacity
	const color = isFull ? '#dc2626' : '#16a34a'

	return (
		<CircleMarker
			center={[zone.lat, zone.lon]}
			radius={11}
			pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
		>
			<Popup>
				<ZonePopup
					zone={zone}
					hasActiveSession={hasActiveSession}
					onBook={onBook}
				/>
			</Popup>
		</CircleMarker>
	)
}

export default memo(ZoneMarker)
