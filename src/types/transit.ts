export type TransitMode = 'bus' | 'trolley' | 'subway' | 'rail' | 'patco'

export interface Vehicle {
  id: string
  mode: TransitMode
  route: string
  lat: number
  lng: number
  heading: number
  speed?: number
  label: string
  destination?: string
  late?: number
  timestamp: number
}

export interface Alert {
  id: string
  route: string
  message: string
  type: 'delay' | 'detour' | 'info'
}

export interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  routes: string[]
}

export interface Departure {
  route: string
  destination: string
  scheduledTime: string
  late?: number
  mode: TransitMode
}

export interface PatcoStation {
  id: string
  name: string
  lat: number
  lng: number
  distanceFromStart: number
}
