import { useTransitStore } from '../store/transitStore'
import { MODE_COLORS, MODE_EMOJI, MODE_LABELS } from '../config'
import { getLateStatus } from '../utils/colors'
import type { Vehicle } from '../types/transit'

function VehicleRow({ v }: { v: Vehicle }) {
  const color = MODE_COLORS[v.mode]
  const status = getLateStatus(v.late)
  return (
    <div
      className="flex-shrink-0 w-44 rounded-xl p-3 bg-philly-dark-3 border border-philly-dark-4 flex flex-col gap-2"
      style={{ borderLeftColor: color, borderLeftWidth: 2 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0"
          style={{ backgroundColor: color + '30', color }}
        >
          {v.route}
        </span>
        <span className="text-philly-white/30 text-[10px] truncate">{MODE_EMOJI[v.mode]}</span>
      </div>
      <p className="text-philly-white text-xs font-semibold leading-tight truncate">
        {v.destination || MODE_LABELS[v.mode]}
      </p>
      <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md self-start ${status.bgClass} ${status.textClass}`}>
        {status.label}
      </div>
      <p className="text-philly-white/20 text-[10px]">#{v.label}</p>
    </div>
  )
}

export default function DeparturesPanel() {
  const { vehicles, activeTab } = useTransitStore()

  if (activeTab !== 'departures') return null

  const visible = vehicles
    .filter((v) => v.destination)
    .slice(0, 30)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        background: 'rgba(13,13,13,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,98,0,0.25)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.7)',
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-philly-dark-4">
        <h2 className="font-display font-black text-philly-orange text-base tracking-wide">
          ACTIVE DEPARTURES
        </h2>
        <span className="text-philly-white/30 text-xs">{visible.length} vehicles</span>
      </div>

      <div
        className="flex gap-3 px-4 py-3 overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {visible.length === 0 ? (
          <p className="text-philly-white/30 text-sm py-4 text-center w-full">
            No departures with destinations found
          </p>
        ) : (
          visible.map((v) => (
            <div key={v.id} style={{ scrollSnapAlign: 'start' }}>
              <VehicleRow v={v} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
