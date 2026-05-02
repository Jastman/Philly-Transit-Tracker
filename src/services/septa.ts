import type { Vehicle, Alert, TransitMode } from '../types/transit'
import { SEPTA_API_BASE } from '../config'

// ─── TransitViewAll response (all buses + trolleys in one call) ──────────────

interface TransitViewVehicle {
  VehicleID: string
  BlockID?: string
  Direction?: string
  destination?: string
  Destination?: string
  heading?: string | number
  Heading?: string | number
  Latitude?: string | number
  Longitude?: string | number
  lat?: string | number
  lng?: string | number
  late?: string | number
  label?: string
  route_id?: string
  RouteID?: string
  trip_id?: string
  Offset?: number
}

interface TransitViewAllResponse {
  bus?: TransitViewVehicle[]
  trolley?: TransitViewVehicle[]
  train?: TransitViewVehicle[]
  el?: TransitViewVehicle[]
  // api.septa.org may return a flat array or a nested object
  routes?: Record<string, TransitViewVehicle[]>
  [key: string]: unknown
}

// ─── TrainView response (Regional Rail) ─────────────────────────────────────

interface TrainViewVehicle {
  lat: string
  lon?: string
  lng?: string
  trainno: string
  service?: string
  dest?: string
  destination?: string
  line?: string
  late?: number | string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function num(v: string | number | undefined, fallback = 0): number {
  if (v === undefined || v === null) return fallback
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? fallback : n
}

function heading(v: string | number | undefined): number {
  const h = num(v)
  return ((h % 360) + 360) % 360
}

function late(v: number | string | undefined): number {
  if (v === undefined || v === null) return 0
  const n = typeof v === 'number' ? v : parseInt(String(v), 10)
  return isNaN(n) ? 0 : n
}

function validCoord(lat: number, lng: number): boolean {
  return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

function mapTransitViewVehicle(
  v: TransitViewVehicle,
  route: string,
  mode: TransitMode,
  idx: number
): Vehicle | null {
  const lat = num(v.Latitude ?? v.lat)
  const lng = num(v.Longitude ?? v.lng)
  if (!validCoord(lat, lng)) return null

  return {
    id: `${mode}-${route}-${v.VehicleID || v.BlockID || v.label || idx}`,
    mode,
    route: v.route_id ?? v.RouteID ?? route,
    lat,
    lng,
    heading: heading(v.Heading ?? v.heading),
    label: v.VehicleID || v.label || String(idx),
    destination: v.Destination ?? v.destination,
    late: late(v.late ?? v.Offset),
    timestamp: Date.now(),
  }
}

// ─── Fetch all buses and trolleys in one shot ────────────────────────────────

function parseSurfaceResponse(raw: unknown, out: Vehicle[]): void {
  // Handle flat array (api.septa.org returns all vehicles as a single array)
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const v = raw[i] as TransitViewVehicle
      const route = v.route_id ?? v.RouteID ?? 'unknown'
      const mapped = mapTransitViewVehicle(v, route, modeForRoute(route, 'bus'), i)
      if (mapped) out.push(mapped)
    }
    return
  }
  // Handle wrapped formats: {data: [...]} or {vehicles: [...]}
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) { parseSurfaceResponse(obj.data, out); return }
    if (Array.isArray(obj.vehicles)) { parseSurfaceResponse(obj.vehicles, out); return }
  }
  // Handle object-keyed format: {bus: [...], trolley: [...], routes: {...}}
  const entries = extractVehicleEntries(raw as TransitViewAllResponse)
  for (const { vehicles, route, mode } of entries) {
    for (let i = 0; i < vehicles.length; i++) {
      const v = mapTransitViewVehicle(vehicles[i], route, mode, i)
      if (v) out.push(v)
    }
  }
}

export async function fetchAllSurfaceVehicles(): Promise<Vehicle[]> {
  const results: Vehicle[] = []

  for (const url of [
    `${SEPTA_API_BASE}/TransitView/all`,
    'https://corsproxy.io/?https://www3.septa.org/api/TransitViewAll/index.php',
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue
      const raw: unknown = await res.json()
      parseSurfaceResponse(raw, results)
      if (results.length > 0) return results
    } catch { /* try next */ }
  }

  return results
}

// Module-scope route → mode mapping (shared by both parsers)
const TROLLEY_ROUTES = new Set(['10', '11', '13', '15', '34', '36'])
const SUBWAY_ROUTES = new Set(['BSL', 'MFL'])

function modeForRoute(routeId: string, defaultMode: TransitMode): TransitMode {
  if (SUBWAY_ROUTES.has(routeId)) return 'subway'
  if (TROLLEY_ROUTES.has(routeId)) return 'trolley'
  return defaultMode
}

interface VehicleEntry {
  vehicles: TransitViewVehicle[]
  route: string
  mode: TransitMode
}

function extractVehicleEntries(data: TransitViewAllResponse): VehicleEntry[] {
  const out: VehicleEntry[] = []

  function processArray(arr: TransitViewVehicle[], defaultMode: TransitMode) {
    // Group by route_id if available, else treat as single group
    const byRoute = new Map<string, TransitViewVehicle[]>()
    for (const v of arr) {
      const r = v.route_id ?? v.RouteID ?? 'unknown'
      if (!byRoute.has(r)) byRoute.set(r, [])
      byRoute.get(r)!.push(v)
    }
    for (const [route, vehicles] of byRoute) {
      out.push({ vehicles, route, mode: modeForRoute(route, defaultMode) })
    }
  }

  if (Array.isArray(data.bus)) processArray(data.bus, 'bus')
  if (Array.isArray(data.trolley)) processArray(data.trolley, 'trolley')
  if (Array.isArray(data.train)) processArray(data.train, 'subway')
  if (Array.isArray(data.el)) processArray(data.el, 'subway')

  // Handle routes map (api.septa.org may return { routes: { "1": [...], "2": [...] } })
  if (data.routes && typeof data.routes === 'object') {
    for (const [route, vehicles] of Object.entries(data.routes)) {
      if (Array.isArray(vehicles)) {
        out.push({ vehicles, route, mode: modeForRoute(route, 'bus') })
      }
    }
  }

  // Handle top-level route keys (e.g., { "1": [...], "33": [...] })
  if (out.length === 0) {
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const arr = value as TransitViewVehicle[]
        const mode = modeForRoute(key, 'bus')
        out.push({ vehicles: arr, route: key, mode })
      }
    }
  }

  return out
}

// ─── Regional Rail ───────────────────────────────────────────────────────────

export async function fetchRailVehicles(): Promise<Vehicle[]> {
  // Try new API first
  for (const url of [
    `${SEPTA_API_BASE}/TrainView`,
    'https://corsproxy.io/?https://www3.septa.org/api/TrainView/index.php',
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data: TrainViewVehicle[] = await res.json()
      if (!Array.isArray(data)) continue

      return data
        .map((v): Vehicle => ({
          id: `rail-${v.trainno}`,
          mode: 'rail',
          route: v.line ?? v.service ?? 'Rail',
          lat: num(v.lat),
          lng: num(v.lon ?? v.lng),
          heading: 0,
          label: v.trainno || 'Train',
          destination: v.dest ?? v.destination,
          late: late(v.late),
          timestamp: Date.now(),
        }))
        .filter((v) => validCoord(v.lat, v.lng))
    } catch { /* try next */ }
  }
  return []
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

interface AlertEntry {
  route_id?: string
  advisory_message?: string
  current_message?: string
  detour_message?: string
  isadvisory?: boolean | string
  isdetour?: boolean | string
  message?: string
  header_text?: string
  description_text?: string
  effect?: string
}

export async function fetchAlerts(): Promise<import('../types/transit').Alert[]> {
  for (const url of [
    `${SEPTA_API_BASE}/Alerts`,
    'https://corsproxy.io/?https://www3.septa.org/api/Alerts/index.php?json=1',
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const data: Record<string, AlertEntry | AlertEntry[]> | AlertEntry[] = await res.json()

      const alerts: import('../types/transit').Alert[] = []

      const processItem = (key: string, item: AlertEntry) => {
        const message =
          item.advisory_message || item.current_message || item.detour_message ||
          item.message || item.header_text || item.description_text || ''
        if (!message || message.length < 5) return
        const isDetour = item.isdetour === true || item.isdetour === '1' || item.effect === 'DETOUR'
        const isAdvisory = item.isadvisory === true || item.isadvisory === '1'
        alerts.push({
          id: `${key}-${alerts.length}`,
          route: item.route_id ?? key,
          message: message.replace(/<[^>]*>/g, '').trim(),
          type: isDetour ? 'detour' : isAdvisory ? 'delay' : 'info',
        })
      }

      if (Array.isArray(data)) {
        data.forEach((item, i) => processItem(String(i), item))
      } else {
        for (const [key, value] of Object.entries(data)) {
          const items = Array.isArray(value) ? value : [value]
          items.forEach((item) => {
            if (item && typeof item === 'object') processItem(key, item)
          })
        }
      }

      if (alerts.length > 0) return alerts.slice(0, 20)
    } catch { /* try next */ }
  }
  return []
}
