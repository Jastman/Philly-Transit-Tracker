import type { TransitMode } from '../types/transit'
import { MODE_COLORS } from '../config'

export function getModeColor(mode: TransitMode): string {
  return MODE_COLORS[mode]
}

export function getLateStatus(late: number | undefined): {
  color: string
  label: string
  bgClass: string
  textClass: string
} {
  const l = late ?? 0
  if (l <= 0) {
    return { color: '#22c55e', label: 'On Time', bgClass: 'bg-green-500/20', textClass: 'text-green-400' }
  }
  if (l <= 5) {
    return { color: '#f59e0b', label: `${l} min late`, bgClass: 'bg-amber-500/20', textClass: 'text-amber-400' }
  }
  return { color: '#ef4444', label: `${l} min late`, bgClass: 'bg-red-500/20', textClass: 'text-red-400' }
}

export function getHeadingArrow(heading: number): string {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']
  const idx = Math.round(((heading % 360) + 360) % 360 / 45) % 8
  return arrows[idx]
}
