import './App.css'
import { useAuth } from './context/AuthContext'
import { matchRoute, usePath, Link } from './lib/router'
import Nav from './components/Nav'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import VehicleFormPage from './pages/VehicleFormPage'

function Routes() {
  const path = usePath()
  const route = matchRoute(path)

  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />
    case 'vehicles':
      return <VehiclesPage />
    case 'vehicle-new':
      return <VehicleFormPage />
    case 'vehicle-edit':
      return <VehicleFormPage key={route.id} id={route.id} />
    case 'vehicle-detail':
      return <VehicleDetailPage key={route.id} id={route.id} />
    default:
      return (
        <div className="page empty">
          <p>Page not found.</p>
          <Link to="/" className="btn btn-primary">
            Back to overview
          </Link>
        </div>
      )
  }
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="splash">
        <span className="auth-logo">SK</span>
      </div>
    )
  }

  if (!session) return <AuthPage />

  return (
    <div className="app">
      <Nav />
      <main className="content">
        <Routes />
      </main>
    </div>
  )
}
