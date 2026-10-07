import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api/axiosInstance'
import { setUser } from '../features/auth/authSlice'

export default function useProfile() {
	const dispatch = useDispatch()
	const user = useSelector((state) => state.auth.user)
	const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

	useEffect(() => {
		if (isAuthenticated && !user) {
			api.get('/users/me')
				.then((res) => dispatch(setUser(res.data)))
				.catch(() => {})
		}
	}, [isAuthenticated, user, dispatch])

	return user
}
