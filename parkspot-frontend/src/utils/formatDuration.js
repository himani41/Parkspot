export function formatDuration(minutes) {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	if (h === 0) return `${m} min`
	return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}
