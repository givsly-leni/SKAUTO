import { Link, usePath } from '../lib/router'
import { useAuth } from '../context/AuthContext'

const ITEMS = [
  { to: '/', label: 'Overview', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/vehicles', label: 'Vehicles', icon: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6h-2v-2H7v2H5zm2.5 2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
  { to: '/vehicles/new', label: 'Add car', icon: 'M12 5v14M5 12h14' },
]

function isActive(path: string, to: string) {
  if (to === '/') return path === '/'
  if (to === '/vehicles/new') return path === '/vehicles/new'
  return path.startsWith('/vehicles') && path !== '/vehicles/new'
}

export default function Nav() {
  const path = usePath()
  const { signOut } = useAuth()

  return (
    <>
      {/* Phone: compact header — the tab bar has no room for Sign out */}
      <header className="mobile-header">
        <img src="/icons/icon-192.png" alt="" className="brand-logo-img" />
        <span className="brand-name">SK AUTO GARAGE</span>
        <button className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      {/* Desktop / laptop: top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <img
              src="/icons/icon-192.png"
              alt=""
              className="brand-logo-img"
            />
            <span className="brand-name">SK AUTO GARAGE</span>
          </Link>

          <nav className="topbar-links">
            {ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={isActive(path, item.to) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button className="btn btn-ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {/* iPhone: bottom tab bar */}
      <nav className="tabbar">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={isActive(path, item.to) ? 'tab active' : 'tab'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={item.icon}
                fill={item.to === '/vehicles/new' ? 'none' : 'currentColor'}
                stroke={item.to === '/vehicles/new' ? 'currentColor' : 'none'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
