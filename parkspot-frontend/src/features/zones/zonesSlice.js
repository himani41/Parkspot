import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axiosInstance'
import { logout } from '../auth/authSlice'
import { MIN_ZOOM } from '../../config/constants'

// Loads only the zones inside the visible map area, and only when zoomed in
export const fetchZones = createAsyncThunk(
	'zones/fetchZones',
	async (_, { getState }) => {
		const { viewport } = getState().zones
		if (!viewport || viewport.zoom < MIN_ZOOM) return []
		const { south, north, west, east } = viewport
		const response = await api.get('/zones', {
			params: { south, north, west, east },
		})
		return response.data
	}
)

export const fetchActiveSession = createAsyncThunk(
	'zones/fetchActiveSession',
	async () => {
		const response = await api.get('/sessions/active')
		return response.data || null
	}
)

// Step 2 of booking: hold the spot and get the card form's clientSecret
export const createBooking = createAsyncThunk(
	'zones/createBooking',
	async (body, { rejectWithValue }) => {
		try {
			const response = await api.post('/bookings', body)
			return response.data // { session, clientSecret }
		} catch (err) {
			return rejectWithValue(
				err.response?.data?.error || 'Could not book this spot'
			)
		}
	}
)

export const cancelPending = createAsyncThunk(
	'zones/cancelPending',
	async (sessionId, { rejectWithValue }) => {
		try {
			await api.post(`/sessions/${sessionId}/cancel`)
			return sessionId
		} catch (err) {
			return rejectWithValue(
				err.response?.data?.error || 'Could not cancel booking'
			)
		}
	}
)

export const leaveSession = createAsyncThunk(
	'zones/leaveSession',
	async (sessionId, { rejectWithValue }) => {
		try {
			const response = await api.post(
				`/zones/sessions/${sessionId}/leave`
			)
			return response.data
		} catch (err) {
			return rejectWithValue(
				err.response?.data?.error || 'Could not end session'
			)
		}
	}
)

const zonesSlice = createSlice({
	name: 'zones',
	initialState: {
		list: [],
		status: 'idle',
		error: null,
		activeSession: null,
		pending: null, // { session, clientSecret } while waiting for payment
		viewport: null, // { south, north, west, east, zoom }
		latestFetchId: null, // lets us ignore out-of-date responses
	},
	reducers: {
		setViewport: (state, action) => {
			state.viewport = action.payload
		},
		clearSession: (state) => {
			state.activeSession = null
		},
		dismissPending: (state) => {
			state.pending = null
		},
		// Only update zones we already have on screen
		zoneUpdated: (state, action) => {
			const i = state.list.findIndex((z) => z.id === action.payload.id)
			if (i >= 0) state.list[i] = action.payload
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchZones.pending, (state, action) => {
				state.latestFetchId = action.meta.requestId
				if (state.list.length === 0) state.status = 'loading'
			})
			.addCase(fetchZones.fulfilled, (state, action) => {
				if (action.meta.requestId !== state.latestFetchId) return // a newer request exists
				state.status = 'succeeded'
				state.list = action.payload
			})
			.addCase(fetchZones.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(createBooking.fulfilled, (state, action) => {
				state.pending = action.payload
			})
			.addCase(fetchActiveSession.fulfilled, (state, action) => {
				const s = action.payload
				if (s && s.status === 'ACTIVE') {
					state.activeSession = s
					state.pending = null
				} else if (s && s.status === 'PENDING_PAYMENT') {
					state.activeSession = null
					if (state.pending?.session?.id !== s.id) {
						state.pending = { session: s, clientSecret: null }
					}
				} else {
					state.activeSession = null
					state.pending = null
				}
			})
			.addCase(cancelPending.fulfilled, (state) => {
				state.pending = null
			})
			.addCase(leaveSession.fulfilled, (state) => {
				state.activeSession = null
			})
			.addCase(logout, (state) => {
				state.list = []
				state.activeSession = null
				state.pending = null
				state.viewport = null
				state.status = 'idle'
			})
	},
})

export const { setViewport, clearSession, dismissPending, zoneUpdated } =
	zonesSlice.actions
export default zonesSlice.reducer
