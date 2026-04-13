import { useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmallParkingLot } from "@/components/parking/small-parking-lot"
import { LargeParkingLot } from "@/components/parking/large-parking-lot"
import { SpotDetailSheet } from "@/components/parking/spot-detail-sheet"
import { NotificationSettings } from "@/components/parking/notification-settings"
import { UpcomingReleases } from "@/components/parking/upcoming-releases"
import { useAuth } from "@/hooks/use-auth"
import { useOpenReportCount } from "@/hooks/use-open-report-count"
import { useSSE } from "@/hooks/use-sse"
import { cn } from "@/lib/utils"
import type { components } from "@/lib/api-types"

type ParkingArea = "small" | "large"
type ParkingSpace = components["schemas"]["ParkingSpace"]

export default function ParkingPage() {
  const [activeArea, setActiveArea] = useState<ParkingArea>("large")
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpace | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [liveSpaces, setLiveSpaces] = useState<ParkingSpace[] | undefined>(undefined)
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const openReportCount = useOpenReportCount()

  const handleSSEUpdate = useCallback((spaces: ParkingSpace[]) => {
    setLiveSpaces(spaces)
  }, [])

  useSSE(handleSSEUpdate)

  const smallSpaces = liveSpaces?.filter((s) => s.spotNumber != null && s.spotNumber >= 53)
  const largeSpaces = liveSpaces?.filter((s) => s.spotNumber != null && s.spotNumber <= 30)

  const userHasNoSpot = user?.parkingSpotNumber == null

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-center">
        <div />
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">ParVer</h1>
          <p className="text-sm text-muted-foreground">
            Parkplatzverwaltung &ndash; AFBB
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user?.displayName}
          </span>
          {isAdmin && (
            <span className="relative">
              <Button variant="ghost" size="icon-sm" asChild title="Verwaltung">
                <Link to="/administration/users">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              {openReportCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
                  +{openReportCount}
                </span>
              )}
            </span>
          )}
          <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="Abmelden">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="mt-6 flex gap-2">
        <Button
          variant={activeArea === "small" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveArea("small")}
          className={cn(
            "transition-all",
            activeArea !== "small" && "text-muted-foreground",
          )}
        >
          Kleine Parkfl&auml;che
        </Button>
        <Button
          variant={activeArea === "large" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveArea("large")}
          className={cn(
            "transition-all",
            activeArea !== "large" && "text-muted-foreground",
          )}
        >
          Gro&szlig;e Parkfl&auml;che
        </Button>
      </div>

      {/* Parking Lot Content */}
      <div className="mt-6 flex w-full max-w-2xl flex-1 justify-center">
        <AnimatePresence mode="wait">
          {activeArea === "small" ? (
            <motion.div
              key="small"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <SmallParkingLot onSpotClick={setSelectedSpot} refreshKey={refreshKey} spaces={smallSpaces} />
            </motion.div>
          ) : (
            <motion.div
              key="large"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <LargeParkingLot onSpotClick={setSelectedSpot} refreshKey={refreshKey} spaces={largeSpaces} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Settings for users without parking spot */}
      {userHasNoSpot && (
        <div className="mt-4 w-full max-w-2xl">
          <NotificationSettings />
        </div>
      )}

      {/* Upcoming Releases */}
      <div className="mt-6 w-full max-w-2xl">
        <UpcomingReleases spaces={liveSpaces} />
      </div>

      {/* Spot Detail Sheet */}
      <SpotDetailSheet
        spot={selectedSpot}
        onClose={() => {
          setSelectedSpot(null)
          setRefreshKey((k) => k + 1)
        }}
      />

      {/* Footer */}
      <div className="mt-auto flex flex-col items-center gap-1 pt-6">
        <p className="text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} Splatgames.de Software
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/40">
          Build {__BUILD_TIMESTAMP__}
        </p>
      </div>
    </div>
  )
}
