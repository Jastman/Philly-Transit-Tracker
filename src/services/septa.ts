import type { Vehicle, Alert, TransitMode } from '../types/transit'
import { SEPTA_API_BASE } from '../config'

interface TransitViewVehicle {
  lng: string
  lat: string
  label: string
  route_id?: string
  trip_id?: string
  BlockID?: string
  destination?: string
  heading?: string
  late?: number | string
}

interface TransitViewResponse {
  bus?: TransitViewVehicle[]
  trolley?: TransitViewVehicle[]
  train?: TransitViewVehicle[]
  el?: TransitViewVehicle[]
}

interface TrainViewVehicle {
  lat: string
  lon: string
  trainno: string
  service?: string
  dest?: string
  line?: string
  late?: number | string
  SOURCE?: string
}

function parseNum(val: string | number | undefined, fallback = 0): number {
  if (val === undefined || val === null) return fallback
  const n = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(n) ? fallback : n
}

function parseHeading(val: string | number | undefined): number {
  const h = parseNum(val)
  return ((h % 360) + 360) % 360
}

function parseLate(val: number | string | undefined): number {
  if (val === undefined || val === null) return 0
  const n = typeof val === 'number' ? val : parseInt(String(val), 10)
  return isNaN(n) ? 0 : n
}

export async function fetchRouteVehicles(route: string, mode: TransitMode): Promise<Vehicle[]> {
  try {
    const res = await fetch(
      `${SEPTA_API_BASE}/TransitView/index.php?route=${encodeURIComponent(route)}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []

    const data: TransitViewResponse = await res.json()
    const vehicles: TransitViewVehicle[] = [
      ...(data.bus ?? []),
      ...(data.trolley ?? []),
      ...(data.train ?? []),
      ...(data.el ?? []),
    ]

    return vehicles
      .map((v, i): Vehicle => ({
        id: `${route}-${v.label || i}-${v.trip_id || v.BlockID || i}`,
        mode,
        route,
        lat: parseNum(v.lat),
        lng: parseNum(v.lng),
        heading: parseHeading(v.heading),
        label: v.label || route,
        destination: v.destination,
        late: parseLate(v.late),
        timestamp: Date.now(),
      }))
      .filter(v => v.lat !== 0 && v.lng !== 0 && !isNaN(v.lat) && !isNaN(v.lng))
  } catch {
    return []
  }
}

export async function fetchRailVehicles(): Promise<Vehicle[]> {
  try {
    const res = await fetch(`${SEPTA_API_BASE}/TrainView/index.php`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data: TrainViewVehicle[] = await res.json()
    return data
      .map((v): Vehicle => ({
        id: `rail-${v.trainno}`,
        mode: 'rail',
        route: v.line ?? v.service ?? 'Rail',
        lat: parseNum(v.lat),
        lng: parseNum(v.lon),
        heading: 0,
        label: v.trainno || 'Train',
        destination: v.dest,
        late: parseLate(v.late),
        timestamp: Date.now(),
      }))
      .filter(v => v.lat !== 0 && v.lng !== 0 && !isNaN(v.lat) && !isNaN(v.lng))
  } catch {
    return []
  }
}

interface AlertEntry {
  route_id?: string
  advisory_message?: string
  current_message?: string
  detour_message?: string
  isadvisory?: boolean | string
  isdetour?: boolean | string
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${SEPTA_API_BASE}/Alerts/index.php?json=1`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data: Record<string, AlertEntry | AlertEntry[]> = await res.json()
    const alerts: Alert[] = []

    for (const [key, value] of Object.entries(data)) {
      const items = Array.isArray(value) ? value : [value]
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const message =
          item.advisory_message || item.current_message || item.detour_message || ''
        if (!message || message.length < 5) continue

        const isDetour = item.isdetour === true || item.isdetour === '1'
        const isAdvisory = item.isadvisory === true || item.isadvisory === '1'

        alerts.push({
          id: `${key}-${alerts.length}`,
          route: item.route_id || key,
          message: message.replace(/<[^>]*>/g, '').trim(),
          type: isDetour ? 'detour' : isAdvisory ? 'delay' : 'info',
        })
      }
    }

    return alerts.slice(0, 20)
  } catch {
    return []
  }
}
