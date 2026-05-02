import { create } from 'zustand'
import type { Vehicle, Alert, TransitMode } from '../types/transit'

export type ActiveTab = 'map' | 'departures' | 'alerts'

export interface FilterState {
  modes: Set<TransitMode>
  showDelayedOnly: boolean
}

const ALL_MODES = new Set<TransitMode>(['bus', 'trolley', 'subway', 'rail', 'patco'])

interface TransitStore {
  vehicles: Vehicle[]
  alerts: Alert[]
  selectedVehicle: Vehicle | null
  isLoading: boolean
  loadingProgress: number
  filters: FilterState
  drawerOpen: boolean
  activeTab: ActiveTab
  vehicleCount: number

  setVehicles: (vehicles: Vehicle[]) => void
  setAlerts: (alerts: Alert[]) => void
  selectVehicle: (vehicle: Vehicle | null) => void
  setLoading: (isLoading: boolean, progress?: number) => void
  toggleMode: (mode: TransitMode) => void
  toggleDelayedOnly: () => void
  setDrawerOpen: (open: boolean) => void
  setActiveTab: (tab: ActiveTab) => void
}

export const useTransitStore = create<TransitStore>((set) => ({
  vehicles: [],
  alerts: [],
  selectedVehicle: null,
  isLoading: true,
  loadingProgress: 0,
  filters: { modes: ALL_MODES, showDelayedOnly: false },
  drawerOpen: false,
  activeTab: 'map',
  vehicleCount: 0,

  setVehicles: (vehicles) => set({ vehicles, vehicleCount: vehicles.length }),
  setAlerts: (alerts) => set({ alerts }),
  selectVehicle: (vehicle) =>
    set({ selectedVehicle: vehicle, activeTab: vehicle ? 'map' : 'map' }),
  setLoading: (isLoading, progress) =>
    set((s) => ({ isLoading, loadingProgress: progress ?? s.loadingProgress })),
  toggleMode: (mode) =>
    set((s) => {
      const modes = new Set(s.filters.modes)
      modes.has(mode) ? modes.delete(mode) : modes.add(mode)
      return { filters: { ...s.filters, modes } }
    }),
  toggleDelayedOnly: () =>
    set((s) => ({
      filters: { ...s.filters, showDelayedOnly: !s.filters.showDelayedOnly },
    })),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
}))

export function getFilteredVehicles(vehicles: Vehicle[], filters: FilterState): Vehicle[] {
  return vehicles.filter((v) => {
    if (!filters.modes.has(v.mode)) return false
    if (filters.showDelayedOnly && (v.late ?? 0) <= 0) return false
    return true
  })
}
