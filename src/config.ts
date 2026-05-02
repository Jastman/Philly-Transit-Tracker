import type { TransitMode } from './types/transit'

// SEPTA API doesn't send CORS headers, so we proxy through corsproxy.io for browser access.
// In local dev, Vite's proxy (see vite.config.ts) intercepts /septa-api/ → www3.septa.org
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IS_DEV = (import.meta as any).env?.DEV === true
export const SEPTA_API_BASE = IS_DEV
  ? '/septa-api'
  : 'https://corsproxy.io/?https://www3.septa.org/api'

export const BUS_ROUTES = [
  '1', '2', '5', '9', '12', '17', '21', '23', '25', '29',
  '31', '33', '37', '40', '42', '44', '47', '52', '56', '60',
  '65', '66',
]

export const TROLLEY_ROUTES = ['10', '11', '13', '15', '34', '36']
export const SUBWAY_ROUTES = ['BSL', 'MFL']

export const MODE_COLORS: Record<TransitMode, string> = {
  bus: '#0057A8',
  trolley: '#006F5C',
  subway: '#FF6200',
  rail: '#C5001A',
  patco: '#7C3AED',
}

export const MODE_LABELS: Record<TransitMode, string> = {
  bus: 'Bus',
  trolley: 'Trolley',
  subway: 'Subway',
  rail: 'Regional Rail',
  patco: 'PATCO',
}

export const MODE_EMOJI: Record<TransitMode, string> = {
  bus: '🚌',
  trolley: '🚃',
  subway: '🚇',
  rail: '🚆',
  patco: '🚊',
}

export const POLL_INTERVAL_VEHICLES = 20_000
export const POLL_INTERVAL_ALERTS = 60_000

export const PHILLY_CENTER = {
  lat: 39.9526,
  lng: -75.1652,
  alt: 18000,
}

export const SASSY_LINES = [
  "Yo, where's my bus?",
  'Loading your cheesesteak express...',
  'Tracking them Septa joints...',
  'Hold up, finding your ride...',
  'On time? In this economy?',
  'Jawn is loading...',
  'Broad & Pattison? We got you.',
  'Eagle fans ride MFL. Just sayin\'.',
]
