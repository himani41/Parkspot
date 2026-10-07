import axios from 'axios'
import { logout } from '../features/auth/authSlice'

const api = axios.create({
	baseURL: 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

export function setupInterceptors(store) {
	api.interceptors.response.use(
		(response) => response,
		(error) => {
			const isAuthCall = error.config?.url?.startsWith('/auth')
			if (error.response?.status === 401 && !isAuthCall) {
				store.dispatch(logout())
			}
			return Promise.reject(error)
		}
	)
}

export default api
