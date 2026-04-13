import { useEffect, useRef, useCallback, useState } from "react"
import { apiClient } from "@/lib/api"
import type { components } from "@/lib/api-types"

type ParkingSpace = components["schemas"]["ParkingSpace"]

const BASE_URL = "/api"
const MAX_RECONNECT_DELAY = 30000
const INITIAL_RECONNECT_DELAY = 1000

export function useSSE(onUpdate: (spaces: ParkingSpace[]) => void) {
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY)
  const onUpdateRef = useRef(onUpdate)

  // Keep callback ref up to date without re-triggering effect
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const connect = useCallback(() => {
    const token = localStorage.getItem("parver_access_token")
    if (!token) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = `${BASE_URL}/parking-spaces/events?token=${encodeURIComponent(token)}`
    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.addEventListener("parking-update", (event) => {
      try {
        const spaces: ParkingSpace[] = JSON.parse(event.data)
        onUpdateRef.current(spaces)
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
        setConnected(true)
      } catch {
        // ignore parse errors
      }
    })

    eventSource.onerror = () => {
      setConnected(false)
      eventSource.close()
      eventSourceRef.current = null

      // Exponential backoff reconnect with token refresh
      const delay = reconnectDelayRef.current
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY)

      reconnectTimeoutRef.current = setTimeout(async () => {
        await apiClient.tryRefresh()
        connect()
      }, delay)
    }

    eventSource.onopen = () => {
      setConnected(true)
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [connect])

  // Reconnect with fresh token when a proactive refresh happens
  useEffect(() => {
    const unsubscribe = apiClient.onTokenRefreshed(() => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
      connect()
    })
    return unsubscribe
  }, [connect])

  return { connected }
}
