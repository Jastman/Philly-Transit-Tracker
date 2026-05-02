import { useState } from 'react'
import { useTransitStore } from '../store/transitStore'
import clsx from 'clsx'

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  )
}

export default function FAB() {
  const { setActiveTab } = useTransitStore()
  const [locating, setLocating] = useState(false)
  const [denied, setDenied] = useState(false)

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    setDenied(false)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        // Switch to map tab and show user location (we just zoom for now)
        setActiveTab('map')
        // The parent (App) could pick this up via a store action
        // For now, we just indicate success
      },
      () => {
        setLocating(false)
        setDenied(true)
        setTimeout(() => setDenied(false), 3000)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  return (
    <button
      onClick={handleLocate}
      disabled={locating}
      className={clsx(
        'fixed right-4 z-35 w-14 h-14 rounded-2xl flex items-center justify-center',
        'shadow-glow-orange transition-all active:scale-95',
        locating
          ? 'bg-philly-dark-3 text-philly-white/40 animate-pulse'
          : denied
          ? 'bg-red-500/80 text-white'
          : 'bg-philly-orange text-white hover:bg-philly-orange-dark',
      )}
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      aria-label={locating ? 'Locating...' : 'Find my location'}
    >
      {locating ? (
        <div className="w-5 h-5 border-2 border-philly-white/40 border-t-philly-white/80 rounded-full animate-spin" />
      ) : (
        <LocateIcon />
      )}
    </button>
  )
}
