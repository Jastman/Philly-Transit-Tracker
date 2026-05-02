import clsx from 'clsx'
import { useTransitStore } from '../store/transitStore'
import { MODE_COLORS, MODE_LABELS, MODE_EMOJI } from '../config'
import { getLateStatus, getHeadingArrow } from '../utils/colors'

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function VehiclePopup() {
  const { selectedVehicle, selectVehicle } = useTransitStore()

  if (!selectedVehicle) return null

  const v = selectedVehicle
  const color = MODE_COLORS[v.mode]
  const status = getLateStatus(v.late)
  const arrow = getHeadingArrow(v.heading)

  return (
    <>
      {/* Mobile bottom sheet */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-40 md:hidden animate-slide-up',
          'bg-philly-dark-2 rounded-t-2xl',
        )}
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
          borderTop: `2px solid ${color}40`,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.7)',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-philly-white/20" />
        </div>
        <VehicleCard v={v} color={color} status={status} arrow={arrow} onClose={() => selectVehicle(null)} />
      </div>

      {/* Desktop card — bottom left */}
      <div
        className={clsx(
          'hidden md:block fixed bottom-6 left-6 z-40 w-80 animate-bounce-in',
          'bg-philly-dark-2 rounded-2xl overflow-hidden',
        )}
        style={{
          borderLeft: `3px solid ${color}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
      >
        <VehicleCard v={v} color={color} status={status} arrow={arrow} onClose={() => selectVehicle(null)} />
      </div>
    </>
  )
}

interface VehicleCardProps {
  v: ReturnType<typeof useTransitStore.getState>['selectedVehicle'] & object
  color: string
  status: ReturnType<typeof getLateStatus>
  arrow: string
  onClose: () => void
}

function VehicleCard({ v, color, status, arrow, onClose }: VehicleCardProps) {
  const coords = `${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}`

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: color + '25', border: `1.5px solid ${color}50` }}
          >
            {MODE_EMOJI[v.mode]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: color, color: '#fff' }}
              >
                {v.route}
              </span>
              <span className="text-philly-white/40 text-xs">{MODE_LABELS[v.mode]}</span>
            </div>
            <p className="text-philly-white font-bold text-base mt-0.5 leading-tight">
              {v.destination || 'In Service'}
            </p>
            <p className="text-philly-white/40 text-xs">Vehicle #{v.label}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-philly-white/40 hover:text-philly-white transition-colors -mr-1 -mt-1"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Status row */}
      <div className="flex gap-2 mb-3">
        <div
          className={clsx(
            'flex-1 rounded-xl py-2 px-3 flex items-center gap-2',
            status.bgClass
          )}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <span className={clsx('text-sm font-semibold', status.textClass)}>
            {status.label}
          </span>
        </div>

        <div className="bg-philly-dark-3 rounded-xl py-2 px-3 flex items-center gap-2 min-w-[72px] justify-center">
          <span className="text-xl leading-none">{arrow}</span>
          <span className="text-philly-white/50 text-xs">{Math.round(v.heading)}°</span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-philly-dark-3 rounded-lg p-2.5">
          <div className="text-philly-white/30 mb-0.5">Coordinates</div>
          <div className="text-philly-white/70 font-mono text-[11px]">{coords}</div>
        </div>
        <div className="bg-philly-dark-3 rounded-lg p-2.5">
          <div className="text-philly-white/30 mb-0.5">Mode</div>
          <div className="text-philly-white/70 font-semibold" style={{ color }}>
            {MODE_LABELS[v.mode]}
          </div>
        </div>
      </div>

      {/* Last updated */}
      <p className="text-philly-white/25 text-[10px] mt-2.5 text-right">
        Updated {new Date(v.timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}
