import { useEffect, useState } from "react"
import { reportsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { components } from "@/lib/api-types"

type ParkingSpotReport = components["schemas"]["ParkingSpotReport"]

export function useOpenReportCount() {
  const { isAdmin } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false

    reportsApi.getAll().then(async (response) => {
      if (cancelled || !response.ok) return
      const reports: ParkingSpotReport[] = await response.json()
      const openCount = reports.filter((r) => r.status === "OPEN").length
      setCount(Math.min(openCount, 9))
    }).catch(() => {})

    return () => { cancelled = true }
  }, [isAdmin])

  return count
}
