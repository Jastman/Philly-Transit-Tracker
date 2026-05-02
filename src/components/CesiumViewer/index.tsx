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

// Camera geometry (portrait phone, VFOV ≈ 91°, half = 45.5°, pitch = -55°):
//   At altitude=1500 m, OFFSET=0.020° (≈2226 m behind vehicle):
//   vehicle angle below horiz = arctan(1500/2226) ≈ 33.97°
//   screen position above center = 55° − 33.97° = 21.03°
//   fraction from top = 50% − (21.03/45.5)*50% ≈ 27%
// → vehicle lands at ~27% from top, safely above the info panel.
function followCameraFor(
  lat: number,
  lng: number,
  headingDeg: number
): { destination: Cesium.Cartesian3; headingRad: number } {
  const H = Cesium.Math.toRadians(headingDeg)
  const OFFSET = 0.020  // ~2.2 km behind vehicle in heading direction
  return {
    destination: Cesium.Cartesian3.fromDegrees(
      lng - Math.sin(H) * OFFSET,
      lat - Math.cos(H) * OFFSET,
      1500
    ),
    headingRad: Cesium.Math.toRadians(headingDeg),
  }
}

const TRACKING_LERP = 0.035  // smooth follow: ~95% convergence in ~1.5 s at 60 fps

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const healthSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const routeSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const prevSelectedRef = useRef<string | null>(null)
  const trackingVehicleRef = useRef<string | null>(null)
  const trackingHeadingRef = useRef<number>(0)
  const flyingRef = useRef(false)  // true while flyTo is animating

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

    // ── Per-frame smooth camera tracking ─────────────────────────────────────
    // Uses SampledPositionProperty interpolation from entityManager for buttery
    // smooth follow — no 20-second jumps, no flyTo conflicts.
    const postRenderCb = () => {
      if (flyingRef.current) return  // let the initial flyTo complete first

      const trackingId = trackingVehicleRef.current
      if (!trackingId || !dataSourceRef.current) return

      const entity = dataSourceRef.current.entities.getById(trackingId)
      if (!entity?.position) return

      const entityPos = entity.position.getValue(viewer.clock.currentTime)
      if (!entityPos) return

      const carto = Cesium.Cartographic.fromCartesian(entityPos)
      const lat = Cesium.Math.toDegrees(carto.latitude)
      const lng = Cesium.Math.toDegrees(carto.longitude)

      const { destination, headingRad } = followCameraFor(lat, lng, trackingHeadingRef.current)

      const cam = viewer.camera
      const dx = destination.x - cam.position.x
      const dy = destination.y - cam.position.y
      const dz = destination.z - cam.position.z

      // Stop lerping when close enough (~20 m)
      if (dx * dx + dy * dy + dz * dz < 400) return

      cam.setView({
        destination: new Cesium.Cartesian3(
          cam.position.x + dx * TRACKING_LERP,
          cam.position.y + dy * TRACKING_LERP,
          cam.position.z + dz * TRACKING_LERP,
        ),
        orientation: {
          heading: headingRad,
          pitch: Cesium.Math.toRadians(-55),
          roll: 0,
        },
      })
    }

    viewer.scene.postRender.addEventListener(postRenderCb)

    // ── Click handler ─────────────────────────────────────────────────────────
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(
      (e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(e.position)
        if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
          const entityId = (picked.id as Cesium.Entity).id as string
          // Skip clicks on route/health overlay entities
          if (entityId.startsWith('corridor-') || entityId.startsWith('ring-') ||
              entityId.startsWith('selected-') || entityId.startsWith('station-')) return

          const vehicle = getVehicleById(entityId)
          if (vehicle) {
            selectVehicle(vehicle)
            trackingVehicleRef.current = vehicle.id
            trackingHeadingRef.current = vehicle.heading

            // Quick flyTo to snap into follow position; postRender takes over after
            flyingRef.current = true
            const { destination, headingRad } = followCameraFor(
              vehicle.lat, vehicle.lng, vehicle.heading
            )
            viewer.camera.flyTo({
              destination,
              orientation: { heading: headingRad, pitch: Cesium.Math.toRadians(-55), roll: 0 },
              duration: 0.8,
              complete: () => { flyingRef.current = false },
              cancel: () => { flyingRef.current = false },
            })
          }
        } else {
          selectVehicle(null)
          trackingVehicleRef.current = null
          flyingRef.current = false
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )

    return () => {
      handler.destroy()
      viewer.scene.postRender.removeEventListener(postRenderCb)
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

  // Sync vehicles + health overlays each poll; update tracking heading
  useEffect(() => {
    if (!dataSourceRef.current || !healthSourceRef.current) return
    syncVehicles(dataSourceRef.current, vehicles, filters)
    syncDelayRings(healthSourceRef.current, vehicles)
    syncCorridorLines(healthSourceRef.current, vehicles)

    const trackingId = trackingVehicleRef.current
    if (trackingId) {
      const updated = vehicles.find((v) => v.id === trackingId)
      if (updated) {
        // Keep heading current so postRender orients camera correctly
        trackingHeadingRef.current = updated.heading
        if (routeSourceRef.current) updateSelectedRoutePulse(routeSourceRef.current, updated)
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
      flyingRef.current = false
      if (routeSourceRef.current) hideSelectedRoute(routeSourceRef.current)
    }
  }, [selectedVehicle])

  return <div ref={containerRef} className="absolute inset-0" />
}
