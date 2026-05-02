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
import { PHILLY_CENTER } from '../../config'

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null)
  const prevSelectedRef = useRef<string | null>(null)

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

    // Suppress deprecation warnings from old constructor form
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
      // Use ellipsoid (no terrain) by default — works without Ion token
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      creditContainer: document.createElement('div'),
    })

    viewerRef.current = viewer

    // Set up OSM imagery
    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (Cesium as any).OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
        credit: new Cesium.Credit('© OpenStreetMap contributors', false),
      })
    )

    // Dark night feel for globe
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a1a2e')
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#0d0d0d')
    viewer.scene.globe.depthTestAgainstTerrain = false
    viewer.scene.fog.enabled = false
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true
      viewer.scene.skyAtmosphere.hueShift = 0.1
    }

    // Stylized 3D OSM buildings (requires Ion token)
    if (ionToken) {
      Cesium.createOsmBuildingsAsync().then((tileset) => {
        if (!viewer.isDestroyed()) {
          viewer.scene.primitives.add(tileset)
          tileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('#1e2a3a', 0.95)",
          })
        }
      }).catch(() => { /* skip if Ion unavailable */ })
    }

    // Dramatic fly-in to City Hall, angled to show buildings
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        PHILLY_CENTER.lng,
        PHILLY_CENTER.lat,
        PHILLY_CENTER.alt
      ),
      orientation: {
        heading: Cesium.Math.toRadians(15),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0,
      },
      duration: 3.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
    })

    // Add vehicle data source
    const ds = new Cesium.CustomDataSource('vehicles')
    viewer.dataSources.add(ds)
    dataSourceRef.current = ds

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction(
      (e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(e.position)
        if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
          const entityId = (picked.id as Cesium.Entity).id as string
          const vehicle = getVehicleById(entityId)
          if (vehicle) {
            selectVehicle(vehicle)
            // Fly camera to vehicle
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(vehicle.lng, vehicle.lat, 3000),
              orientation: {
                heading: viewer.camera.heading,
                pitch: Cesium.Math.toRadians(-35),
                roll: 0,
              },
              duration: 1.2,
            })
          }
        } else {
          selectVehicle(null)
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )

    return () => {
      handler.destroy()
      if (viewer && !viewer.isDestroyed()) {
        clearEntities(ds)
        viewer.destroy()
      }
      viewerRef.current = null
      dataSourceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync vehicles when data or filters change
  useEffect(() => {
    if (!dataSourceRef.current) return
    syncVehicles(dataSourceRef.current, vehicles, filters)
  }, [vehicles, filters])

  // Highlight selected vehicle
  useEffect(() => {
    const prev = prevSelectedRef.current
    if (prev) unhighlightEntity(prev)
    if (selectedVehicle) {
      highlightEntity(selectedVehicle.id)
      prevSelectedRef.current = selectedVehicle.id
    } else {
      prevSelectedRef.current = null
    }
  }, [selectedVehicle])

  return <div ref={containerRef} className="absolute inset-0" />
}
