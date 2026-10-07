import { useCallback, useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import { useDispatch } from 'react-redux'
import { fetchZones, setViewport } from '../features/zones/zonesSlice'

export default function MapViewportWatcher() {
	const dispatch = useDispatch()
	const map = useMap()

	const report = useCallback(() => {
		const b = map.getBounds()
		dispatch(
			setViewport({
				south: b.getSouth(),
				north: b.getNorth(),
				west: b.getWest(),
				east: b.getEast(),
				zoom: map.getZoom(),
			})
		)
		dispatch(fetchZones())
	}, [map, dispatch])

	useMapEvents({ moveend: report }) // also fires after a zoom
	useEffect(() => {
		report() // load the first view
	}, [report])

	return null // draws nothing
}
