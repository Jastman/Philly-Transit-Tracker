import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { useTransitStore } from '../../store/transitStore'
import {
  syncVehicles,
  clearEntities,
  getVehicleById,
  highlightEntity,
  unhighlightEntity,
} from './entityManager'
import { syncDelayRings, clearDelayRings } from './routeHealth'
import { syncCorridorLines, clearCorridorLines } from './corridorLines'
import {
  showSelectedRoute,
  hideSelectedRoute,
  updateSelectedRoutePulse,
} from './selectedRoute'
import { PHILLY_CENTER } from '../../config'

// Compute a camera destination that places the vehicle in the upper ~30% of the
// viewport so it stays visible above the bottom info panel.  The camera sits
// ~1 km "behind" the vehicle (opposite its heading direction) at 2000 m altitude.
function followCameraFor(
  lat: number,
  lng: number,
  headingDeg: number
): { destination: Cesium.Cartesian3; headingRad: number } {
  const H = Cesium.Math.toRadians(headingDeg)
  const OFFSET = 0.009  // ~1 km in degrees
  return {
    destination: Cesium.Cartesian3.fromDegrees(
      lng - Math.sin(H) * OFFSET,
      lat - Math.cos(H) * OFFSET,
      2000
    ),
    headingRad: Cesium.Math.toRadians(headingDeg),
  }
}

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const healthSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const routeSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const prevSelectedRef = useRef<string | null>(null)
  const trackingVehicleRef = useRef<string | null>(null)

  const vehicles = useTransitStore((s) => s.vehicles)
  const filters = useTransitStore((s) => s.filters)
  const selectVehicle = useTransitStore((s) => s.selectVehicle)
  const selectedVehicle = useTransitStore((s) => s.selectedVehicle)

  // Initialize Cesium viewer once
  useEffect(() => {
    if (!containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ionToken: string | undefined = (import.meta as any).env?.VITE_CESIUM_ION_TOKEN
    if (ionToken) Cesium.Ion.defaultAccessToken = ionToken

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      creditContainer: document.createElement('div'),
    })

    viewerRef.current = viewer

    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (Cesium as any).OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
        credit: new Cesium.Credit('© OpenStreetMap contributors', false),
      })
    )

    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a1a2e')
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0d0d0d')
    viewer.scene.globe.depthTestAgainstTerrain = false
    viewer.scene.fog.enabled = false
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true
      viewer.scene.skyAtmosphere.hueShift = 0.1
    }

    // Stylized OSM 3D buildings — dark navy tint to match app theme
    if (ionToken) {
      Cesium.createOsmBuildingsAsync().then((tileset) => {
        const v = viewerRef.current
        if (v && !v.isDestroyed()) {
          v.scene.primitives.add(tileset)
          tileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('#162032', 0.88)",
          })
        }
      }).catch(() => { /* skip if Ion unavailable */ })
    }

    // Fly in to City Hall, angled to reveal buildings
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        PHILLY_CENTER.lng,
        PHILLY_CENTER.lat,
        PHILLY_CENTER.alt
      ),
      orientation: {
        heading: Cesium.Math.toRadians(15),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 3.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    })

    const ds = new Cesium.CustomDataSource('vehicles')
    viewer.dataSources.add(ds)
    dataSourceRef.current = ds

    const hs = new Cesium.CustomDataSource('health')
    viewer.dataSources.add(hs)
    healthSourceRef.current = hs

    const rs = new Cesium.CustomDataSource('route')
    viewer.dataSources.add(rs)
    routeSourceRef.current = rs

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(
      (e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(e.position)
        if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
          const entityId = (picked.id as Cesium.Entity).id as string
          const vehicle = getVehicleById(entityId)
          if (vehicle) {
            selectVehicle(vehicle)
            trackingVehicleRef.current = vehicle.id
            // Position camera behind vehicle so it appears in the upper half
            const { destination, headingRad } = followCameraFor(
              vehicle.lat, vehicle.lng, vehicle.heading
            )
            viewer.camera.flyTo({
              destination,
              orientation: { heading: headingRad, pitch: Cesium.Math.toRadians(-50), roll: 0 },
              duration: 1.5,
            })
          }
        } else {
          selectVehicle(null)
          trackingVehicleRef.current = null
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )

    return () => {
      handler.destroy()
      if (viewer && !viewer.isDestroyed()) {
        clearEntities(ds)
        clearDelayRings(hs)
        clearCorridorLines(hs)
        hideSelectedRoute(rs)
        viewer.destroy()
      }
      viewerRef.current = null
      dataSourceRef.current = null
      healthSourceRef.current = null
      routeSourceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync vehicles + health overlays + camera follow on each poll
  useEffect(() => {
    if (!dataSourceRef.current || !healthSourceRef.current) return
    syncVehicles(dataSourceRef.current, vehicles, filters)
    syncDelayRings(healthSourceRef.current, vehicles)
    syncCorridorLines(healthSourceRef.current, vehicles)

    // Follow selected vehicle
    const trackingId = trackingVehicleRef.current
    if (trackingId) {
      const updated = vehicles.find((v) => v.id === trackingId)
      if (updated) {
        if (routeSourceRef.current) updateSelectedRoutePulse(routeSourceRef.current, updated)

        const viewer = viewerRef.current
        if (viewer && !viewer.isDestroyed()) {
          const { destination, headingRad } = followCameraFor(
            updated.lat, updated.lng, updated.heading
          )
          // Slow drift — vehicle updates every 20s so 5s duration feels smooth
          viewer.camera.flyTo({
            destination,
            orientation: { heading: headingRad, pitch: Cesium.Math.toRadians(-50), roll: 0 },
            duration: 5.0,
          })
        }
      }
    }
  }, [vehicles, filters])

  // Show / hide route overlay when selection changes
  useEffect(() => {
    const prev = prevSelectedRef.current
    if (prev) unhighlightEntity(prev)

    if (selectedVehicle) {
      highlightEntity(selectedVehicle.id)
      prevSelectedRef.current = selectedVehicle.id
      if (routeSourceRef.current) showSelectedRoute(routeSourceRef.current, selectedVehicle)
    } else {
      prevSelectedRef.current = null
      trackingVehicleRef.current = null
      if (routeSourceRef.current) hideSelectedRoute(routeSourceRef.current)
    }
  }, [selectedVehicle])

  return <div ref={containerRef} className="absolute inset-0" />
}
