import { useEffect, useState, useCallback } from 'react'

/**
 * Tiny hash-router. We avoid a router library to keep dependency surface minimal.
 * All routes are normalised to a leading slash, e.g. "#/slicer" → "/slicer".
 */

export type Route = '/slicer' | '/converter'

export const DEFAULT_ROUTE: Route = '/slicer'

function readHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || DEFAULT_ROUTE
  if (raw === '/slicer' || raw === '/converter') return raw
  return DEFAULT_ROUTE
}

export function navigate(route: Route): void {
  if (window.location.hash !== `#${route}`) {
    window.location.hash = route
  }
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? DEFAULT_ROUTE : readHash()
  )

  useEffect(() => {
    const onChange = (): void => setRoute(readHash())
    window.addEventListener('hashchange', onChange)
    // Initialise hash if absent so links land in a known state.
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = useCallback((r: Route) => navigate(r), [])
  return [route, go]
}
