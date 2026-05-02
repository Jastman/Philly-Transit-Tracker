import * as Cesium from 'cesium'
import type { Vehicle } from '../../types/transit'
import { PATCO_STATIONS } from '../../services/patco'

// Known route shapes (simplified corridor waypoints)
const ROUTE_COORDS: Record<string, number[]> = {
  BSL: [-75.1506, 40.0350, -75.1510, 40.0213, -75.1635, 39.9636, -75.1635, 39.9524, -75.1635, 39.9326, -75.1724, 39.9044],
  MFL: [-75.2580, 39.9576, -75.1818, 39.9563, -75.1512, 39.9529, -75.1340, 39.9533, -75.0439, 40.0142],
  '23': [-75.2014, 40.0784, -75.1870, 40.0520, -75.1630, 40.0089, -75.1636, 39.9524, -75.1665, 39.9336],
  '47': [-75.1300, 40.0208, -75.1398, 39.9900, -75.1580, 39.9524, -75.1580, 39.9098],
  '42': [-75.1636, 39.9524, -75.1900, 39.9520, -75.2025, 39.9524, -75.2295, 39.9472],
  '10': [-75.2584, 39.9566, -75.2200, 39.9546, -75.2023, 39.9520, -75.1636, 39.9524],
  '11': [-75.2584, 39.9566, -75.2200, 39.9546, -75.2023, 39.9520, -75.1636, 39.9524],
  '13': [-75.2584, 39.9566, -75.2200, 39.9546, -75.2023, 39.9520, -75.1636, 39.9524],
  '21': [-75.2380, 39.9340, -75.1694, 39.9275, -75.1450, 39.9290],
}

// Brighter highlight colors per mode
const HIGHLIGHT_COLORS: Record<string, string> = {
  bus: '#60a5fa',
  trolley: '#34d399',
  subway: '#fb923c',
  rail: '#f87171',
  patco: '#a78bfa',
}

let routeEntity: Cesium.Entity | null = null
let pulseEntity: Cesium.Entity | null = null

export function showSelectedRoute(ds: Cesium.CustomDataSource, vehicle: Vehicle): void {
  hideSelectedRoute(ds)

  let coords: number[] | null = null
  if (vehicle.mode === 'patco') {
    coords = PATCO_STATIONS.flatMap((s) => [s.lng, s.lat])
  } else {
    coords = ROUTE_COORDS[vehicle.route] ?? null
  }

  const color = Cesium.Color.fromCssColorString(HIGHLIGHT_COLORS[vehicle.mode] ?? '#ffffff')

  if (coords) {
    const positions: Cesium.Cartesian3[] = []
    for (let i = 0; i < coords.length; i += 2) {
      // Slightly elevated so it renders above corridor lines
      positions.push(Cesium.Cartesian3.fromDegrees(coords[i], coords[i + 1], 12))
    }
    routeEntity = ds.entities.add({
      id: 'selected-route-line',
      polyline: {
        positions,
        width: 7,
        material: new Cesium.ColorMaterialProperty(color.withAlpha(0.95)),
      },
    })
  }

  // Pulsing location circle at vehicle position (always shown)
  pulseEntity = ds.entities.add({
    id: 'selected-route-pulse',
    position: Cesium.Cartesian3.fromDegrees(vehicle.lng, vehicle.lat, 8),
    ellipse: {
      semiMajorAxis: 200,
      semiMinorAxis: 200,
      height: 8,
      material: new Cesium.ColorMaterialProperty(color.withAlpha(0.25)),
      outline: true,
      outlineColor: new Cesium.ConstantProperty(color.withAlpha(0.9)),
      outlineWidth: 3,
    },
  })
}

export function updateSelectedRoutePulse(ds: Cesium.CustomDataSource, vehicle: Vehicle): void {
  if (!pulseEntity) return
  const color = Cesium.Color.fromCssColorString(HIGHLIGHT_COLORS[vehicle.mode] ?? '#ffffff')
  const pos = Cesium.Cartesian3.fromDegrees(vehicle.lng, vehicle.lat, 8)
  pulseEntity.position = new Cesium.ConstantPositionProperty(pos)
  if (pulseEntity.ellipse) {
    pulseEntity.ellipse.material = new Cesium.ColorMaterialProperty(color.withAlpha(0.25))
    pulseEntity.ellipse.outlineColor = new Cesium.ConstantProperty(color.withAlpha(0.9))
  }
}

export function hideSelectedRoute(ds: Cesium.CustomDataSource): void {
  if (routeEntity) { ds.entities.remove(routeEntity); routeEntity = null }
  if (pulseEntity) { ds.entities.remove(pulseEntity); pulseEntity = null }
}
