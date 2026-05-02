import CesiumViewer from './components/CesiumViewer'
import LoadingScreen from './components/LoadingScreen'
import TopBar from './components/TopBar'
import FilterDrawer from './components/FilterDrawer'
import VehiclePopup from './components/VehiclePopup'
import AlertsBanner from './components/AlertsBanner'
import DeparturesPanel from './components/DeparturesPanel'
import AlertsPanel from './components/AlertsPanel'
import BottomNav from './components/BottomNav'
import FAB from './components/FAB'
import { useVehicles } from './hooks/useVehicles'
import { useAlerts } from './hooks/useAlerts'

export default function App() {
  useVehicles()
  useAlerts()

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-philly-dark">
      {/* 3D globe — fills entire screen */}
      <CesiumViewer />

      {/* Loading overlay */}
      <LoadingScreen />

      {/* Fixed UI overlays */}
      <TopBar />
      <AlertsBanner />
      <FilterDrawer />

      {/* Vehicle selection popup */}
      <VehiclePopup />

      {/* Tab-controlled bottom sheets */}
      <DeparturesPanel />
      <AlertsPanel />

      {/* Bottom navigation (mobile-first) */}
      <BottomNav />

      {/* Floating locate button */}
      <FAB />
    </div>
  )
}
