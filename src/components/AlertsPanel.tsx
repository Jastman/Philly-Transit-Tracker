import { useTransitStore } from '../store/transitStore'
import { MODE_COLORS } from '../config'
import type { Alert } from '../types/transit'
import clsx from 'clsx'

const TYPE_CONFIG = {
  delay: { icon: '⚠️', label: 'Delay', color: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  detour: { icon: '🔄', label: 'Detour', color: '#FF6200', bg: 'bg-philly-orange/15', text: 'text-philly-orange' },
  info: { icon: 'ℹ️', label: 'Info', color: '#60a5fa', bg: 'bg-blue-500/15', text: 'text-blue-400' },
}

function AlertCard({ alert }: { alert: Alert }) {
  const cfg = TYPE_CONFIG[alert.type]
  return (
    <div
      className={clsx('rounded-xl p-4 border', cfg.bg)}
      style={{ borderColor: cfg.color + '40' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ backgroundColor: MODE_COLORS.bus + '30', color: MODE_COLORS.bus }}
            >
              {alert.route}
            </span>
            <span className={clsx('text-[10px] font-bold uppercase tracking-wide', cfg.text)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-philly-white/80 text-sm leading-snug">{alert.message}</p>
        </div>
      </div>
    </div>
  )
}

export default function AlertsPanel() {
  const { alerts, activeTab } = useTransitStore()

  if (activeTab !== 'alerts') return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        maxHeight: '70dvh',
        background: 'rgba(13,13,13,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,98,0,0.25)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.7)',
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-philly-dark-4">
        <h2 className="font-display font-black text-philly-orange text-base tracking-wide">
          SYSTEM ALERTS
        </h2>
        {alerts.length > 0 && (
          <span className="text-red-400 text-xs">{alerts.length} active</span>
        )}
      </div>

      <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(70dvh - 56px)' }}>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-philly-white/50 text-sm">All clear, jawn!</p>
            <p className="text-philly-white/25 text-xs mt-1">No active alerts right now.</p>
          </div>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>
    </div>
  )
}
