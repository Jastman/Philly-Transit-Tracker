import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useTransitStore } from '../store/transitStore'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function BellIcon({ hasAlerts }: { hasAlerts: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={hasAlerts ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function OrbitLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7 flex-shrink-0">
      <circle cx="14" cy="14" r="4" fill="#FF6200" />
      <ellipse cx="14" cy="14" rx="12" ry="5" stroke="#FF6200" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="14" cy="14" rx="12" ry="5" stroke="#FFB612" strokeWidth="1.5" opacity="0.4"
        transform="rotate(60 14 14)" />
      <circle cx="14" cy="2" r="2" fill="#FFB612" />
      <circle cx="24.4" cy="19" r="1.5" fill="#006F5C" />
    </svg>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])
  return <span className="text-philly-white/60 text-xs font-mono tabular-nums">{time}</span>
}

export default function TopBar() {
  const { alerts, vehicleCount, drawerOpen, setDrawerOpen, isLoading } = useTransitStore()
  const alertCount = alerts.length
  const delayedCount = useTransitStore((s) =>
    s.vehicles.filter((v) => (v.late ?? 0) > 5).length
  )

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 h-14"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        background: 'rgba(13,13,13,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,98,0,0.15)',
      }}
    >
      {/* Filter/menu button */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className={clsx(
          'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all',
          drawerOpen
            ? 'bg-philly-orange text-black'
            : 'text-philly-orange hover:bg-philly-orange/15 active:bg-philly-orange/25'
        )}
        aria-label="Open filters"
      >
        <MenuIcon />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <OrbitLogo />
        <div className="min-w-0">
          <h1 className="font-display font-black text-philly-orange text-sm leading-none tracking-wide truncate glow-orange">
            PHILLY TRANSIT ORBIT
          </h1>
          <p className="text-philly-white/30 text-[10px] leading-none mt-0.5 hidden xs:block">
            SEPTA · PATCO · Live
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock />

        {!isLoading && vehicleCount > 0 && (
          <div className="flex items-center gap-1 bg-philly-dark-3 rounded-lg px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-philly-white/70 text-xs font-mono tabular-nums">
              {vehicleCount}
            </span>
          </div>
        )}

        {delayedCount > 0 && (
          <div className="flex items-center gap-1 bg-red-500/15 rounded-lg px-2 py-1">
            <span className="text-red-400 text-xs">⚠</span>
            <span className="text-red-400 text-xs font-mono">{delayedCount}</span>
          </div>
        )}

        {alertCount > 0 && (
          <button
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-philly-gold hover:text-philly-orange transition-colors"
            aria-label={`${alertCount} alerts`}
          >
            <BellIcon hasAlerts={alertCount > 0} />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          </button>
        )}
      </div>
    </header>
  )
}
