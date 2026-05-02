import * as Cesium from 'cesium'
import type { Vehicle } from '../../types/transit'

const ringMap = new Map<string, Cesium.Entity>()

function lateColor(late: number): Cesium.Color {
  if (late >= 10) return Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.5)
  if (late >= 6) return Cesium.Color.fromCssColorString('#FF6200').withAlpha(0.45)
  return Cesium.Color.fromCssColorString('#eab308').withAlpha(0.4)
}

export function syncDelayRings(ds: Cesium.CustomDataSource, vehicles: Vehicle[]): void {
  const lateVehicles = vehicles.filter((v) => (v.late ?? 0) >= 3)
  const ids = new Set(lateVehicles.map((v) => `ring-${v.id}`))

  for (const [id, e] of ringMap) {
    if (!ids.has(id)) {
      ds.entities.remove(e)
      ringMap.delete(id)
    }
  }

  for (const v of lateVehicles) {
    const rid = `ring-${v.id}`
    const lateMin = v.late ?? 0
    const radius = 120 + lateMin * 22
    const color = lateColor(lateMin)
    const pos = Cesium.Cartesian3.fromDegrees(v.lng, v.lat, 0)

    if (ringMap.has(rid)) {
      const e = ringMap.get(rid)!
      e.position = new Cesium.ConstantPositionProperty(pos)
      if (e.ellipse) {
        e.ellipse.semiMajorAxis = new Cesium.ConstantProperty(radius)
        e.ellipse.semiMinorAxis = new Cesium.ConstantProperty(radius)
        e.ellipse.material = new Cesium.ColorMaterialProperty(color)
        e.ellipse.outlineColor = new Cesium.ConstantProperty(color.withAlpha(0.9))
      }
    } else {
      const e = ds.entities.add({
        id: rid,
        position: pos,
        ellipse: {
          semiMajorAxis: radius,
          semiMinorAxis: radius,
          height: 0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          material: new Cesium.ColorMaterialProperty(color),
          outline: true,
          outlineColor: color.withAlpha(0.9),
          outlineWidth: 2,
        },
      })
      ringMap.set(rid, e)
    }
  }
}

export function clearDelayRings(ds: Cesium.CustomDataSource): void {
  for (const e of ringMap.values()) ds.entities.remove(e)
  ringMap.clear()
}
