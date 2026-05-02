import { useEffect } from 'react'
import { useTransitStore } from '../store/transitStore'
import { fetchAllSurfaceVehicles, fetchRailVehicles } from '../services/septa'
import { estimatePatcoPositions } from '../services/patco'
import { POLL_INTERVAL_VEHICLES } from '../config'
import type { Vehicle } from '../types/transit'

async function fetchAll(onProgress: (p: number) => void): Promise<Vehicle[]> {
  // 2 API calls total: all buses/trolleys/subway + all rail
  const [surfaceResult, railResult] = await Promise.allSettled([
    fetchAllSurfaceVehicles().then((v) => { onProgress(0.5); return v }),
    fetchRailVehicles().then((v) => { onProgress(1); return v }),
  ])

  const all: Vehicle[] = []
  if (surfaceResult.status === 'fulfilled') all.push(...surfaceResult.value)
  if (railResult.status === 'fulfilled') all.push(...railResult.value)
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
