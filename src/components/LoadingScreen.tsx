import { useEffect, useState } from 'react'
import { useTransitStore } from '../store/transitStore'
import { SASSY_LINES } from '../config'
import clsx from 'clsx'

function BusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <rect x="4" y="4" width="68" height="36" rx="8" fill="#FF6200" />
      {/* Windows */}
      <rect x="10" y="10" width="14" height="12" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="30" y="10" width="14" height="12" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="50" y="10" width="14" height="12" rx="2" fill="rgba(255,255,255,0.85)" />
      {/* Door */}
      <rect x="10" y="26" width="10" height="14" rx="2" fill="rgba(0,0,0,0.25)" />
      {/* Headlight */}
      <circle cx="73" cy="20" r="4" fill="#FFB612" />
      {/* Wheels */}
      <circle cx="20" cy="44" r="8" fill="#1a1a1a" stroke="#FF6200" strokeWidth="2" />
      <circle cx="20" cy="44" r="3" fill="#333" />
      <circle cx="56" cy="44" r="8" fill="#1a1a1a" stroke="#FF6200" strokeWidth="2" />
      <circle cx="56" cy="44" r="3" fill="#333" />
      {/* Speed lines */}
      <line x1="0" y1="18" x2="8" y2="18" stroke="#FF6200" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="0" y1="24" x2="6" y2="24" stroke="#FF6200" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="0" y1="30" x2="10" y2="30" stroke="#FF6200" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export default function LoadingScreen() {
  const { isLoading, loadingProgress } = useTransitStore()
  const [visible, setVisible] = useState(true)
  const [line, setLine] = useState(SASSY_LINES[0])
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const idx = Math.floor(Math.random() * SASSY_LINES.length)
    setLine(SASSY_LINES[idx])
  }, [])

  useEffect(() => {
    if (!isLoading && visible) {
      setExiting(true)
      const t = setTimeout(() => setVisible(false), 500)
      return () => clearTimeout(t)
    }
  }, [isLoading, visible])

  if (!visible) return null

  const pct = Math.round(loadingProgress * 100)

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-philly-dark',
        'bg-philly-pattern transition-opacity duration-500',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      {/* Animated bus */}
      <div className="animate-bus-run mb-6 drop-shadow-lg">
        <BusIcon className="w-36 h-auto" />
      </div>

      {/* Headline */}
      <h1 className="font-display text-4xl sm:text-5xl font-black text-philly-orange glow-orange mb-2 tracking-tight text-center px-4">
        PHILLY TRANSIT ORBIT
      </h1>

      {/* Tagline */}
      <p className="text-philly-white/70 text-lg sm:text-xl mb-8 text-center px-6 italic">
        {line}
      </p>

      {/* Progress bar */}
      <div className="w-72 sm:w-96">
        <div className="flex justify-between text-xs text-philly-white/40 mb-1.5">
          <span>Tracking {pct}% of Philly's fleet...</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-philly-dark-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-philly-orange rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Mode indicators */}
      <div className="flex gap-3 mt-8 flex-wrap justify-center px-4">
        {[
          { label: 'Bus', color: '#0057A8' },
          { label: 'Trolley', color: '#006F5C' },
          { label: 'Subway', color: '#FF6200' },
          { label: 'Rail', color: '#C5001A' },
          { label: 'PATCO', color: '#7C3AED' },
        ].map(({ label, color }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-xs text-philly-white/60"
          >
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-philly-white/20 text-xs text-center px-4">
        Real-time data powered by SEPTA & PATCO • Built with CesiumJS
      </p>
    </div>
  )
}
