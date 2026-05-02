import { useTransitStore } from '../store/transitStore'
import { MODE_COLORS } from '../config'

const TYPE_ICONS: Record<string, string> = {
  delay: '⚠️',
  detour: '🔄',
  info: 'ℹ️',
}

export default function AlertsBanner() {
  const alerts = useTransitStore((s) => s.alerts)

  if (alerts.length === 0) return null

  const text = alerts
    .map((a) => `${TYPE_ICONS[a.type] || '⚠️'} [${a.route}] ${a.message}`)
    .join('   •   ')

  return (
    <div
      className="fixed left-0 right-0 z-25 overflow-hidden"
      style={{
        top: 'calc(56px + env(safe-area-inset-top))',
        backgroundColor: 'rgba(255, 98, 0, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${MODE_COLORS.bus}30`,
      }}
    >
      <div className="flex items-center py-1.5">
        <div
          className="flex-shrink-0 px-3 py-0.5 text-philly-black font-black text-xs uppercase tracking-wider border-r border-black/20"
          style={{ fontFamily: 'system-ui, Arial Black, sans-serif' }}
        >
          ALERTS
        </div>
        <div className="overflow-hidden flex-1">
          <div
            className="whitespace-nowrap text-philly-black text-xs font-semibold animate-marquee"
            style={{ display: 'inline-block', paddingLeft: '100%' }}
          >
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </div>
        </div>
      </div>
    </div>
  )
}
