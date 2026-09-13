import { useCallback, useEffect, useState } from 'react'

import { getHealth } from '@/services/api'

export type HealthStatus = 'checking' | 'ok' | 'error'

export function useHealthCheck(): { status: HealthStatus; retry: () => void } {
  const [status, setStatus] = useState<HealthStatus>('checking')

  const fetchHealth = useCallback(() => {
    getHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const retry = useCallback(() => {
    setStatus('checking')
    fetchHealth()
  }, [fetchHealth])

  return { status, retry }
}
