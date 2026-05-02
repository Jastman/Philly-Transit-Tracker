import clsx from 'clsx'
import { useTransitStore } from '../store/transitStore'
import type { ActiveTab } from '../store/transitStore'

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function TrainIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="4" y="3" width="16" height="16" rx="2" />
      <line x1="4" y1="11" x2="20" y2="11" />
      <line x1="9" y1="3" x2="9" y2="11" />
      <line x1="8" y1="19" x2="6" y2="22" />
      <line x1="16" y1="19" x2="18" y2="22" />
    </svg>
  )
}

function AlertIcon({ count, active }: { count: number; active: boolean }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  )
}

interface TabConfig {
  id: ActiveTab
  label: string
}

const TABS: TabConfig[] = [
  { id: 'map', label: 'Map' },
  { id: 'departures', label: 'Departures' },
  { id: 'alerts', label: 'Alerts' },
]

export default function BottomNav() {
  const { activeTab, setActiveTab, alerts, selectedVehicle, selectVehicle } = useTransitStore()
  const alertCount = alerts.length

  const handleTabPress = (tab: ActiveTab) => {
    if (tab !== 'map' && selectedVehicle) selectVehicle(null)
    setActiveTab(tab)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-35 flex items-stretch"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,98,0,0.15)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }}
      aria-label="Main navigation"
    >
      {TABS.map(({ id, label }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => handleTabPress(id)}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-all',
              'active:scale-95',
              isActive ? 'text-philly-orange' : 'text-philly-white/40 hover:text-philly-white/70'
            )}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            {id === 'map' && <MapIcon active={isActive} />}
            {id === 'departures' && <TrainIcon active={isActive} />}
            {id === 'alerts' && <AlertIcon count={alertCount} active={isActive} />}
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            {isActive && (
              <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-philly-orange" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
