import type { TransitMode } from './types/transit'

// api.septa.org is the current supported SEPTA API with CORS enabled.
// www3.septa.org is the legacy API (requires proxy for browser use).
export const SEPTA_API_BASE = 'https://api.septa.org/api/v1'

// Legacy fallback (used only if the new API doesn't have an endpoint)
export const SEPTA_LEGACY_BASE = 'https://www3.septa.org/api'


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

// Philadelphia City Hall — Broad & Market
export const PHILLY_CENTER = {
  lat: 39.9524,
  lng: -75.1636,
  alt: 2500,
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
