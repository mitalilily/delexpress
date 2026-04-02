import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getIncomingPickups,
  getCourierDistribution,
  getTopDestinations,
  type Pickup,
  type TopDestination,
  type CourierDistribution,
} from '../../api/dashboard.api'

type DashboardKey = 'pickups' | 'distribution' | 'destinations'

interface DataState<T> {
  data: T
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

const pollingIntervals: Record<DashboardKey, number> = {
  pickups: 30_000,
  distribution: 60_000,
  destinations: 60_000,
}

const shouldShowLoading = (currentData: unknown) => {
  if (Array.isArray(currentData)) {
    return currentData.length === 0
  }
  return currentData === null || currentData === undefined
}

export const useRealtimeHomeDashboard = () => {
  const [pickupsState, setPickupsState] = useState<DataState<Pickup[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })
  const [distributionState, setDistributionState] = useState<DataState<CourierDistribution[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })
  const [destinationsState, setDestinationsState] = useState<DataState<TopDestination[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })

  const isMountedRef = useRef(true)
  const isTabActiveRef = useRef(true)
  const pollTimersRef = useRef<Record<DashboardKey, number | null>>({
    pickups: null,
    distribution: null,
    destinations: null,
  })
  const staggeredTimersRef = useRef<number[]>([])
  const controllersRef = useRef<Record<DashboardKey, AbortController | null>>({
    pickups: null,
    distribution: null,
    destinations: null,
  })
  const isFetchingRef = useRef<Record<DashboardKey, boolean>>({
    pickups: false,
    distribution: false,
    destinations: false,
  })

  const runFetch = useCallback(
    async (key: DashboardKey) => {
      if (isFetchingRef.current[key]) return
      isFetchingRef.current[key] = true
      const controller = new AbortController()
      controllersRef.current[key]?.abort()
      controllersRef.current[key] = controller

      try {
        if (key === 'pickups') {
          setPickupsState((prev) => ({
            ...prev,
            isLoading: shouldShowLoading(prev.data),
          }))
          const payload = await getIncomingPickups({ signal: controller.signal })
          if (!isMountedRef.current) return
          setPickupsState({
            data: payload,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
          })
          return
        }

        if (key === 'distribution') {
          setDistributionState((prev) => ({
            ...prev,
            isLoading: shouldShowLoading(prev.data),
          }))
          const payload = await getCourierDistribution({ signal: controller.signal })
          if (!isMountedRef.current) return
          setDistributionState({
            data: payload,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
          })
          return
        }

        setDestinationsState((prev) => ({
          ...prev,
          isLoading: shouldShowLoading(prev.data),
        }))
        const payload = await getTopDestinations(8, { signal: controller.signal })
        if (!isMountedRef.current) return
        setDestinationsState({
          data: payload,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        })
      } catch (err) {
        if (!isMountedRef.current) return
        const message =
          err instanceof Error
            ? err.message
            : `Unable to refresh ${key}`
        if (key === 'pickups') {
          setPickupsState((prev) => ({
            ...prev,
            isLoading: shouldShowLoading(prev.data),
            error: message,
          }))
        } else if (key === 'distribution') {
          setDistributionState((prev) => ({
            ...prev,
            isLoading: shouldShowLoading(prev.data),
            error: message,
          }))
        } else {
          setDestinationsState((prev) => ({
            ...prev,
            isLoading: shouldShowLoading(prev.data),
            error: message,
          }))
        }
      } finally {
        isFetchingRef.current[key] = false
      }
    },
    [],
  )

  const clearStaggeredTimers = useCallback(() => {
    staggeredTimersRef.current.forEach((timer) => clearTimeout(timer))
    staggeredTimersRef.current = []
  }, [])

  const scheduleInitialLoad = useCallback(() => {
    clearStaggeredTimers()
    const schedule = (key: DashboardKey, delay: number) => {
      if (typeof window !== 'undefined') {
        const timer = window.setTimeout(() => runFetch(key), delay)
        staggeredTimersRef.current.push(timer)
      } else {
        runFetch(key)
      }
    }

    schedule('pickups', 0)
    schedule('distribution', 180)
    schedule('destinations', 360)
  }, [clearStaggeredTimers, runFetch])

  const stopPolling = useCallback(() => {
    Object.keys(pollTimersRef.current).forEach((key) => {
      const typedKey = key as DashboardKey
      const timer = pollTimersRef.current[typedKey]
      if (timer) {
        clearInterval(timer)
        pollTimersRef.current[typedKey] = null
      }
    })
  }, [])

  const startPolling = useCallback(() => {
    if (!isTabActiveRef.current || typeof window === 'undefined') return
    stopPolling()
    Object.entries(pollingIntervals).forEach(([key, interval]) => {
      const typedKey = key as DashboardKey
      pollTimersRef.current[typedKey] = window.setInterval(() => {
        if (!isTabActiveRef.current) return
        runFetch(typedKey)
      }, interval)
    })
  }, [runFetch, stopPolling])

  const abortAll = useCallback(() => {
    Object.values(controllersRef.current).forEach((controller) => controller?.abort())
  }, [])

  const handleVisibilityChange = useCallback(() => {
    const visible = typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true
    isTabActiveRef.current = visible
    if (visible) {
      scheduleInitialLoad()
      startPolling()
    } else {
      stopPolling()
    }
  }, [scheduleInitialLoad, startPolling, stopPolling])

  useEffect(() => {
    scheduleInitialLoad()
    startPolling()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
      abortAll()
      clearStaggeredTimers()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [
    scheduleInitialLoad,
    startPolling,
    handleVisibilityChange,
    stopPolling,
    abortAll,
    clearStaggeredTimers,
  ])

  return {
    incomingPickupsState: pickupsState,
    courierDistributionState: distributionState,
    topDestinationsState: destinationsState,
    refreshHomeData: () => {
      runFetch('pickups')
      runFetch('distribution')
      runFetch('destinations')
    },
  }
}
