import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import { setCredentials } from '../features/auth/authSlice'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		try {
			const res = await api.post('/auth/login', { email, password })
			dispatch(setCredentials({ token: res.data.token }))
			navigate('/')
		} catch (err) {
			setError(err.response?.data?.error || 'Login failed')
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-100'>
			<form
				onSubmit={handleSubmit}
				className='bg-white p-8 rounded-lg shadow w-80 space-y-4'
			>
				<h1 className='text-2xl font-bold'>Login</h1>
				{error && <p className='text-red-600 text-sm'>{error}</p>}
				<input
					className='w-full border p-2 rounded'
					type='email'
					placeholder='Email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<input
					className='w-full border p-2 rounded'
					type='password'
					placeholder='Password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<button className='w-full bg-blue-600 text-white p-2 rounded'>
					Login
				</button>
				<p className='text-sm'>
					{' '}
					No account?{' '}
					<Link className='text-blue-600' to='/signup'>
						Sign up{' '}
					</Link>
				</p>
			</form>
		</div>
	)
}
