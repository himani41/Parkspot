import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	token: localStorage.getItem('token') || null,
	isAuthenticated: !!localStorage.getItem('token'),
	user: null,
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCredentials: (state, action) => {
			state.token = action.payload.token
			state.isAuthenticated = true
			state.user = null
			localStorage.setItem('token', action.payload.token)
		},
		setUser: (state, action) => {
			state.user = action.payload
		},
		logout: (state) => {
			state.token = null
			state.isAuthenticated = false
			state.user = null
			localStorage.removeItem('token')
		},
	},
})

export const { setCredentials, logout, setUser } = authSlice.actions
export default authSlice.reducer
