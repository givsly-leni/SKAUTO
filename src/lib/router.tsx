import { useSyncExternalStore } from 'react'
import type { ReactNode, MouseEvent } from 'react'

/**
 * Tiny hash-based router. Hash routing means no server rewrite rules are
 * needed and deep links work identically on Netlify, on localhost, and
 * inside the iPhone home-screen app.
 */

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getSnapshot() {
  return window.location.hash.slice(1) || '/'
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/')
}

export function navigate(to: string) {
  if (window.location.hash.slice(1) === to) return
  window.location.hash = to
}

interface LinkProps {
  to: string
  children: ReactNode
  className?: string
  title?: string
}

export function Link({ to, children, className, title }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    navigate(to)
  }
  return (
    <a href={`#${to}`} onClick={handleClick} className={className} title={title}>
      {children}
    </a>
  )
}

export type Route =
  | { name: 'dashboard' }
  | { name: 'vehicles' }
  | { name: 'vehicle-new' }
  | { name: 'vehicle-detail'; id: string }
  | { name: 'vehicle-edit'; id: string }
  | { name: 'not-found' }

export function matchRoute(path: string): Route {
  const segments = path.split('?')[0].split('/').filter(Boolean)

  if (segments.length === 0) return { name: 'dashboard' }

  if (segments[0] === 'vehicles') {
    if (segments.length === 1) return { name: 'vehicles' }
    if (segments[1] === 'new') return { name: 'vehicle-new' }
    if (segments.length === 2) return { name: 'vehicle-detail', id: segments[1] }
    if (segments.length === 3 && segments[2] === 'edit') {
      return { name: 'vehicle-edit', id: segments[1] }
    }
  }

  return { name: 'not-found' }
}
