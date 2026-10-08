import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MapPage from './pages/MapPage'
import HistoryPage from './pages/HistoryPage'
import LandingPage from './pages/LandingPage'

function ProtectedRoute({ children }) {
	const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
	return isAuthenticated ? children : <Navigate to='/login' replace />
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/login' element={<Login />} />
				<Route path='/signup' element={<Signup />} />
				<Route
					path='/map'
					element={
						<ProtectedRoute>
							<MapPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/history'
					element={
						<ProtectedRoute>
							<HistoryPage />
						</ProtectedRoute>
					}
				/>
				<Route path='*' element={<Navigate to='/' replace />} />
			</Routes>
		</BrowserRouter>
	)
}
