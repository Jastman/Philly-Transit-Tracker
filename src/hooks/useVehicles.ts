import { useEffect } from 'react'
import { useTransitStore } from '../store/transitStore'
import { fetchRouteVehicles, fetchRailVehicles } from '../services/septa'
import { estimatePatcoPositions } from '../services/patco'
import { BUS_ROUTES, TROLLEY_ROUTES, SUBWAY_ROUTES, POLL_INTERVAL_VEHICLES } from '../config'
import type { Vehicle, TransitMode } from '../types/transit'

interface RouteSpec { route: string; mode: TransitMode }

async function fetchAll(onProgress: (p: number) => void): Promise<Vehicle[]> {
  const specs: RouteSpec[] = [
    ...BUS_ROUTES.map((r) => ({ route: r, mode: 'bus' as TransitMode })),
    ...TROLLEY_ROUTES.map((r) => ({ route: r, mode: 'trolley' as TransitMode })),
    ...SUBWAY_ROUTES.map((r) => ({ route: r, mode: 'subway' as TransitMode })),
  ]

  let done = 0
  const total = specs.length + 1

  const tick = () => onProgress(++done / total)

  const [railResult, ...routeResults] = await Promise.allSettled([
    fetchRailVehicles().then((v) => { tick(); return v }),
    ...specs.map(({ route, mode }) =>
      fetchRouteVehicles(route, mode).then((v) => { tick(); return v })
    ),
  ])

  const all: Vehicle[] = []
  if (railResult.status === 'fulfilled') all.push(...railResult.value)
  for (const r of routeResults) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  all.push(...estimatePatcoPositions())
  return all
}

export function useVehicles() {
  const { setVehicles, setLoading } = useTransitStore()

  useEffect(() => {
    let mounted = true
    let timer: ReturnType<typeof setTimeout>

    const poll = async (initial: boolean) => {
      if (!mounted) return
      if (initial) setLoading(true, 0)

      const vehicles = await fetchAll((p) => {
        if (mounted && initial) setLoading(true, p)
      })

      if (!mounted) return
      setVehicles(vehicles)
      if (initial) setLoading(false, 1)

      timer = setTimeout(() => poll(false), POLL_INTERVAL_VEHICLES)
    }

    poll(true)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [setVehicles, setLoading])
}
