import * as Cesium from 'cesium'
import type { Vehicle } from '../../types/transit'
import type { FilterState } from '../../store/transitStore'
import { getFilteredVehicles } from '../../store/transitStore'
import { getBillboardImage } from '../../utils/billboards'

interface EntityRecord {
  entity: Cesium.Entity
  vehicle: Vehicle
}

const entityMap = new Map<string, EntityRecord>()
const vehicleDataMap = new Map<string, Vehicle>()

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicleDataMap.get(id)
}

export function syncVehicles(
  dataSource: Cesium.CustomDataSource,
  vehicles: Vehicle[],
  filters: FilterState
): void {
  const filtered = getFilteredVehicles(vehicles, filters)
  const currentIds = new Set(filtered.map((v) => v.id))

  // Remove stale entities
  for (const [id, record] of entityMap) {
    if (!currentIds.has(id)) {
      dataSource.entities.remove(record.entity)
      entityMap.delete(id)
      vehicleDataMap.delete(id)
    }
  }

  const now = Cesium.JulianDate.now()

  for (const vehicle of filtered) {
    const newPos = Cesium.Cartesian3.fromDegrees(vehicle.lng, vehicle.lat, 5)
    // PATCO is a symmetric diamond — rotation looks wrong at any angle, so skip it
    const rotation = vehicle.mode === 'patco' ? 0 : Cesium.Math.toRadians(vehicle.heading)
    const image = getBillboardImage(vehicle.mode, false)

    vehicleDataMap.set(vehicle.id, vehicle)

    if (entityMap.has(vehicle.id)) {
      const record = entityMap.get(vehicle.id)!
      const prev = record.vehicle
      const prevPos = Cesium.Cartesian3.fromDegrees(prev.lng, prev.lat, 5)

      // Use sampled position for smooth interpolation
      const posProp = record.entity.position as Cesium.SampledPositionProperty | undefined
      if (posProp && posProp instanceof Cesium.SampledPositionProperty) {
        const prevTime = Cesium.JulianDate.addSeconds(now, -22, new Cesium.JulianDate())
        posProp.addSample(prevTime, prevPos)
        posProp.addSample(now, newPos)
      }

      // Update billboard rotation and image
      const bb = record.entity.billboard
      if (bb) {
        bb.rotation = new Cesium.ConstantProperty(rotation)
        bb.image = new Cesium.ConstantProperty(image)
      }

      record.vehicle = vehicle
    } else {
      const posProp = new Cesium.SampledPositionProperty()
      posProp.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE
      posProp.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD
      posProp.addSample(now, newPos)

      const entity = dataSource.entities.add({
        id: vehicle.id,
        position: posProp,
        billboard: {
          image,
          width: 36,
          height: 36,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          rotation,
          pixelOffset: new Cesium.Cartesian2(0, 0),
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.4, 50000, 0.6),
        },
      })

      entityMap.set(vehicle.id, { entity, vehicle })
    }
  }
}

export function highlightEntity(id: string): void {
  const record = entityMap.get(id)
  if (!record?.entity.billboard) return
  record.entity.billboard.image = new Cesium.ConstantProperty(
    getBillboardImage(record.vehicle.mode, true)
  )
  record.entity.billboard.width = new Cesium.ConstantProperty(46)
  record.entity.billboard.height = new Cesium.ConstantProperty(46)
}

export function unhighlightEntity(id: string): void {
  const record = entityMap.get(id)
  if (!record?.entity.billboard) return
  record.entity.billboard.image = new Cesium.ConstantProperty(
    getBillboardImage(record.vehicle.mode, false)
  )
  record.entity.billboard.width = new Cesium.ConstantProperty(36)
  record.entity.billboard.height = new Cesium.ConstantProperty(36)
}

export function clearEntities(dataSource: Cesium.CustomDataSource): void {
  dataSource.entities.removeAll()
  entityMap.clear()
  vehicleDataMap.clear()
}
