import type { Vehicle, PatcoStation } from '../types/transit'

export const PATCO_STATIONS: PatcoStation[] = [
  { id: 'lndw', name: 'Lindenwold',        lat: 39.8266, lng: -74.9919, distanceFromStart: 0 },
  { id: 'ashl', name: 'Ashland',           lat: 39.8477, lng: -74.9617, distanceFromStart: 3.8 },
  { id: 'wdcr', name: 'Woodcrest',         lat: 39.8545, lng: -74.9422, distanceFromStart: 6.5 },
  { id: 'hadd', name: 'Haddonfield',       lat: 39.8982, lng: -74.9417, distanceFromStart: 12.4 },
  { id: 'wstm', name: 'Westmont',          lat: 39.9036, lng: -75.0003, distanceFromStart: 16.1 },
  { id: 'coll', name: 'Collingswood',      lat: 39.9084, lng: -75.0706, distanceFromStart: 21.3 },
  { id: 'ferr', name: 'Ferry Ave',         lat: 39.9347, lng: -75.1126, distanceFromStart: 27.2 },
  { id: 'bway', name: 'Broadway',          lat: 39.9518, lng: -75.1222, distanceFromStart: 29.5 },
  { id: 'city', name: 'City Hall',         lat: 39.9527, lng: -75.1497, distanceFromStart: 31.8 },
  { id: '8thm', name: '8th & Market',      lat: 39.9519, lng: -75.1533, distanceFromStart: 32.2 },
  { id: '9th',  name: '9th-10th & Locust', lat: 39.9448, lng: -75.1591, distanceFromStart: 33.1 },
  { id: '12th', name: '12-13th & Locust',  lat: 39.9444, lng: -75.1624, distanceFromStart: 33.5 },
  { id: '15th', name: '15-16th & Locust',  lat: 39.9440, lng: -75.1676, distanceFromStart: 34.1 },
]

const TOTAL_KM = PATCO_STATIONS[PATCO_STATIONS.length - 1].distanceFromStart
const TRAVEL_MINUTES = 23
const TRAINS_ACTIVE = 6
const HEADWAY_MINUTES = 15

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function trainPosition(offsetMinutes: number): { lat: number; lng: number; heading: number; dest: string } | null {
  const cycle = TRAVEL_MINUTES * 2 + 4
  const phase = ((offsetMinutes % cycle) + cycle) % cycle

  let fraction: number
  let outbound: boolean

  if (phase <= TRAVEL_MINUTES) {
    fraction = phase / TRAVEL_MINUTES
    outbound = true
  } else if (phase <= TRAVEL_MINUTES + 4) {
    return null
  } else {
    fraction = 1 - (phase - TRAVEL_MINUTES - 4) / TRAVEL_MINUTES
    outbound = false
  }

  const targetKm = fraction * TOTAL_KM

  for (let i = 0; i < PATCO_STATIONS.length - 1; i++) {
    const s1 = PATCO_STATIONS[i]
    const s2 = PATCO_STATIONS[i + 1]
    if (targetKm >= s1.distanceFromStart && targetKm <= s2.distanceFromStart) {
      const t = (targetKm - s1.distanceFromStart) / (s2.distanceFromStart - s1.distanceFromStart)
      const fromLat = outbound ? s1.lat : s2.lat
      const fromLng = outbound ? s1.lng : s2.lng
      const toLat = outbound ? s2.lat : s1.lat
      const toLng = outbound ? s2.lng : s1.lng
      const dLng = toLng - fromLng
      const dLat = toLat - fromLat
      const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360
      return {
        lat: lerp(s1.lat, s2.lat, outbound ? t : 1 - t),
        lng: lerp(s1.lng, s2.lng, outbound ? t : 1 - t),
        heading,
        dest: outbound ? '15-16th & Locust' : 'Lindenwold',
      }
    }
  }

  return null
}

export function estimatePatcoPositions(): Vehicle[] {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()

  const startHour = day === 0 ? 8 : 6
  if (hour < startHour || hour >= 24) return []

  const minutesSinceMidnight = hour * 60 + now.getMinutes() + now.getSeconds() / 60
  const vehicles: Vehicle[] = []

  for (let i = 0; i < TRAINS_ACTIVE; i++) {
    const offset = minutesSinceMidnight + i * HEADWAY_MINUTES
    const pos = trainPosition(offset)
    if (!pos) continue

    vehicles.push({
      id: `patco-train-${i}`,
      mode: 'patco',
      route: 'PATCO',
      lat: pos.lat,
      lng: pos.lng,
      heading: pos.heading,
      label: `PATCO ${i + 1}`,
      destination: pos.dest,
      late: 0,
      timestamp: Date.now(),
    })
  }

  return vehicles
}
