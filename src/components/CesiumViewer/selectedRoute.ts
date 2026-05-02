import * as Cesium from 'cesium'
import type { Vehicle } from '../../types/transit'
import { PATCO_STATIONS } from '../../services/patco'

// Station data for routes with known stops
interface Station { name: string; lat: number; lng: number }

const ROUTE_STATIONS: Record<string, Station[]> = {
  BSL: [
    { name: 'Fern Rock TC', lat: 40.0350, lng: -75.1506 },
    { name: 'Olney', lat: 40.0213, lng: -75.1510 },
    { name: 'Logan', lat: 40.0089, lng: -75.1635 },
    { name: 'North Philadelphia', lat: 39.9943, lng: -75.1635 },
    { name: 'Erie-Torresdale', lat: 39.9782, lng: -75.1635 },
    { name: 'Hunting Park', lat: 39.9724, lng: -75.1635 },
    { name: 'Broad-Erie', lat: 39.9636, lng: -75.1635 },
    { name: 'Broad-Girard', lat: 39.9524, lng: -75.1635 },
    { name: 'City Hall', lat: 39.9526, lng: -75.1635 },
    { name: 'Walnut-Locust', lat: 39.9441, lng: -75.1635 },
    { name: 'Ellsworth-Federal', lat: 39.9326, lng: -75.1724 },
    { name: 'AT&T Station', lat: 39.9044, lng: -75.1724 },
  ],
  MFL: [
    { name: '69th St TC', lat: 39.9576, lng: -75.2580 },
    { name: 'Millbourne', lat: 39.9569, lng: -75.2436 },
    { name: 'Lansdowne', lat: 39.9568, lng: -75.2313 },
    { name: 'East Lansdowne', lat: 39.9566, lng: -75.2220 },
    { name: '46th St', lat: 39.9563, lng: -75.2094 },
    { name: '40th St', lat: 39.9558, lng: -75.2023 },
    { name: '34th St', lat: 39.9554, lng: -75.1944 },
    { name: '30th St', lat: 39.9563, lng: -75.1818 },
    { name: '15th-16th St', lat: 39.9529, lng: -75.1512 },
    { name: '13th St', lat: 39.9531, lng: -75.1490 },
    { name: '11th St', lat: 39.9533, lng: -75.1466 },
    { name: '8th St', lat: 39.9533, lng: -75.1440 },
    { name: '5th St', lat: 39.9533, lng: -75.1415 },
    { name: '2nd St', lat: 39.9533, lng: -75.1390 },
    { name: 'Frankford TC', lat: 40.0142, lng: -75.0439 },
  ],
}

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
const stationEntities: Cesium.Entity[] = []

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

  // Station markers
  let stations: Station[] = []
  if (vehicle.mode === 'patco') {
    stations = PATCO_STATIONS.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }))
  } else if (ROUTE_STATIONS[vehicle.route]) {
    stations = ROUTE_STATIONS[vehicle.route]
  }

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i]
    const e = ds.entities.add({
      id: `station-${vehicle.route}-${i}`,
      position: Cesium.Cartesian3.fromDegrees(s.lng, s.lat, 10),
      point: {
        pixelSize: 10,
        color: Cesium.Color.WHITE,
        outlineColor: color,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(500, 1.2, 30000, 0.4),
      },
      label: {
        text: s.name,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        translucencyByDistance: new Cesium.NearFarScalar(3000, 1.0, 15000, 0.0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    stationEntities.push(e)
  }
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
  for (const e of stationEntities) ds.entities.remove(e)
  stationEntities.length = 0
}
