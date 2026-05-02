import clsx from 'clsx'
import { useTransitStore } from '../store/transitStore'
import { MODE_COLORS, MODE_LABELS, MODE_EMOJI } from '../config'
import type { TransitMode } from '../types/transit'

const MODES: TransitMode[] = ['bus', 'trolley', 'subway', 'rail', 'patco']

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface ModeButtonProps {
  mode: TransitMode
  active: boolean
  count: number
  onToggle: () => void
}

function ModeButton({ mode, active, count, onToggle }: ModeButtonProps) {
  const color = MODE_COLORS[mode]
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'flex items-center gap-3 w-full rounded-xl px-4 min-h-[56px] transition-all',
        'border active:scale-[0.97]',
        active
          ? 'border-transparent text-white'
          : 'border-philly-dark-4 bg-philly-dark-3 text-philly-white/50 hover:border-philly-dark-3'
      )}
      style={active ? { backgroundColor: color + '25', borderColor: color + '60' } : {}}
      aria-pressed={active}
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: active ? color + '30' : '#333' }}
      >
        {MODE_EMOJI[mode]}
      </span>
      <div className="flex-1 text-left">
        <div className="font-semibold text-sm" style={{ color: active ? color : undefined }}>
          {MODE_LABELS[mode]}
        </div>
        <div className="text-xs opacity-50">{count} active</div>
      </div>
      <div
        className={clsx(
          'w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all',
          active ? 'border-transparent' : 'border-philly-white/20'
        )}
        style={active ? { backgroundColor: color } : {}}
      />
    </button>
  )
}

export default function FilterDrawer() {
  const { drawerOpen, setDrawerOpen, filters, toggleMode, toggleDelayedOnly, vehicles } =
    useTransitStore()

  const countByMode = (mode: TransitMode) => vehicles.filter((v) => v.mode === mode).length

  const totalDelayed = vehicles.filter((v) => (v.late ?? 0) > 5).length

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer — bottom sheet on mobile, left sidebar on desktop */}
      <aside
        className={clsx(
          'fixed z-40 bg-philly-dark-2 transition-transform duration-300 ease-out',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-2xl md:rounded-none',
          'md:top-14 md:left-0 md:bottom-0 md:right-auto md:w-72',
          drawerOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:-translate-x-full'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid rgba(255,98,0,0.2)',
          borderRight: '1px solid rgba(255,98,0,0.1)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
        }}
        aria-label="Filters"
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-philly-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-philly-dark-4">
          <h2 className="font-display font-black text-philly-orange text-lg tracking-wide">
            FILTER TRANSIT
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-philly-white/50 hover:text-philly-white transition-colors rounded-lg"
            aria-label="Close filters"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scroll area */}
        <div className="overflow-y-auto max-h-[65vh] md:max-h-none md:h-full p-4 space-y-3">
          {/* Mode toggles */}
          <p className="text-philly-white/30 text-xs font-semibold uppercase tracking-widest mb-2">
            Transit Modes
          </p>

          {MODES.map((mode) => (
            <ModeButton
              key={mode}
              mode={mode}
              active={filters.modes.has(mode)}
              count={countByMode(mode)}
              onToggle={() => toggleMode(mode)}
            />
          ))}

          {/* Delayed only toggle */}
          <div className="pt-3 border-t border-philly-dark-4">
            <p className="text-philly-white/30 text-xs font-semibold uppercase tracking-widest mb-3">
              Quick Filters
            </p>
            <button
              onClick={toggleDelayedOnly}
              className={clsx(
                'flex items-center gap-3 w-full rounded-xl px-4 min-h-[52px] border transition-all',
                filters.showDelayedOnly
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-philly-dark-3 border-philly-dark-4 text-philly-white/50'
              )}
            >
              <span className="text-xl">⚠️</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">Delayed Only</div>
                <div className="text-xs opacity-60">{totalDelayed} vehicles delayed 5+ min</div>
              </div>
              <div
                className={clsx(
                  'w-11 h-6 rounded-full transition-all relative',
                  filters.showDelayedOnly ? 'bg-red-500' : 'bg-philly-dark-4'
                )}
              >
                <div
                  className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                    filters.showDelayedOnly ? 'left-6' : 'left-1'
                  )}
                />
              </div>
            </button>
          </div>

          {/* Data attribution */}
          <div className="pt-4 text-[10px] text-philly-white/20 text-center leading-relaxed">
            Real-time data from SEPTA Open API &amp; PATCO schedule.
            <br />
            Updates every 20 seconds. PATCO positions estimated.
          </div>
        </div>
      </aside>
    </>
  )
}
