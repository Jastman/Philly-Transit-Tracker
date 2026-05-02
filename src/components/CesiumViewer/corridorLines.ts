import * as Cesium from 'cesium'
import type { Vehicle } from '../../types/transit'

interface Corridor {
  id: string
  routes: string[]
  coords: number[]  // flat [lng, lat, lng, lat, ...]
}

const CORRIDORS: Corridor[] = [
  {
    id: 'bsl',
    routes: ['BSL'],
    coords: [-75.1506, 40.0350, -75.1510, 40.0213, -75.1635, 39.9636, -75.1635, 39.9524, -75.1635, 39.9326, -75.1724, 39.9044],
  },
  {
    id: 'mfl',
    routes: ['MFL'],
    coords: [-75.2580, 39.9576, -75.1818, 39.9563, -75.1512, 39.9529, -75.1340, 39.9533, -75.0439, 40.0142],
  },
  {
    id: 'r23',
    routes: ['23'],
    coords: [-75.2014, 40.0784, -75.1870, 40.0520, -75.1630, 40.0089, -75.1636, 39.9524, -75.1665, 39.9336],
  },
  {
    id: 'r47',
    routes: ['47'],
    coords: [-75.1300, 40.0208, -75.1398, 39.9900, -75.1580, 39.9524, -75.1580, 39.9098],
  },
  {
    id: 'r42',
    routes: ['42'],
    coords: [-75.1636, 39.9524, -75.1900, 39.9520, -75.2025, 39.9524, -75.2295, 39.9472],
  },
  {
    id: 'trolleys',
    routes: ['10', '11', '13', '15', '34', '36'],
    coords: [-75.2584, 39.9566, -75.2200, 39.9546, -75.2023, 39.9520, -75.1636, 39.9524],
  },
  {
    id: 'rail',
    routes: ['AIR', 'CHE', 'CHW', 'CYN', 'FOX', 'LAN', 'MED', 'NOR', 'PAO', 'TRE', 'WAR', 'WTR'],
    coords: [-75.1823, 39.9560, -75.1675, 39.9539, -75.1581, 39.9528, -75.1490, 39.9536],
  },
  {
    id: 'r21',
    routes: ['21'],
    coords: [-75.2380, 39.9340, -75.1694, 39.9275, -75.1450, 39.9290],
  },
  {
    id: 'patco',
    routes: ['PATCO'],
    coords: [-74.9919, 39.8266, -74.9617, 39.8477, -74.9422, 39.8545, -74.9417, 39.8982, -75.0003, 39.9036, -75.0706, 39.9084, -75.1126, 39.9347, -75.1222, 39.9518, -75.1497, 39.9527, -75.1533, 39.9519, -75.1591, 39.9448, -75.1624, 39.9444, -75.1676, 39.9440],
  },
]

const lineMap = new Map<string, Cesium.Entity>()

function corridorColor(routes: string[], vehicles: Vehicle[]): Cesium.Color {
  const related = vehicles.filter((v) => routes.includes(v.route))
  if (!related.length) return Cesium.Color.fromCssColorString('#334155').withAlpha(0.45)
  const avg = related.reduce((s, v) => s + (v.late ?? 0), 0) / related.length
  if (avg >= 10) return Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.9)
  if (avg >= 6) return Cesium.Color.fromCssColorString('#FF6200').withAlpha(0.9)
  if (avg >= 3) return Cesium.Color.fromCssColorString('#eab308').withAlpha(0.9)
  return Cesium.Color.fromCssColorString('#22c55e').withAlpha(0.85)
}

export function syncCorridorLines(ds: Cesium.CustomDataSource, vehicles: Vehicle[]): void {
  for (const corridor of CORRIDORS) {
    const color = corridorColor(corridor.routes, vehicles)
    if (lineMap.has(corridor.id)) {
      const e = lineMap.get(corridor.id)!
      if (e.polyline) e.polyline.material = new Cesium.ColorMaterialProperty(color)
    } else {
      const positions: Cesium.Cartesian3[] = []
      for (let i = 0; i < corridor.coords.length; i += 2) {
        positions.push(Cesium.Cartesian3.fromDegrees(corridor.coords[i], corridor.coords[i + 1]))
      }
      const e = ds.entities.add({
        id: `corridor-${corridor.id}`,
        polyline: {
          positions,
          width: 4,
          material: new Cesium.ColorMaterialProperty(color),
          clampToGround: true,
        },
      })
      lineMap.set(corridor.id, e)
    }
  }
}

export function clearCorridorLines(ds: Cesium.CustomDataSource): void {
  for (const e of lineMap.values()) ds.entities.remove(e)
  lineMap.clear()
}
