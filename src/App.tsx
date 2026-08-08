import './App.css'
import { useAuth } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
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

function MissingConfig() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">SK</span>
          <h1>SKAUTO</h1>
        </div>
        <p className="form-error">
          This build is missing its database credentials, so it can not connect
          to Supabase.
        </p>
        <p className="hint">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Netlify site
          environment variables, then trigger a new deploy. They are read at
          build time, so an existing deploy will not pick them up.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (!isSupabaseConfigured) return <MissingConfig />

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
