import { useEffect } from 'react'
import { useTransitStore } from '../store/transitStore'
import { fetchAlerts } from '../services/septa'
import { POLL_INTERVAL_ALERTS } from '../config'

export function useAlerts() {
  const setAlerts = useTransitStore((s) => s.setAlerts)

  useEffect(() => {
    let mounted = true
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (!mounted) return
      const alerts = await fetchAlerts()
      if (mounted) setAlerts(alerts)
      timer = setTimeout(poll, POLL_INTERVAL_ALERTS)
    }

    poll()
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [setAlerts])
}
