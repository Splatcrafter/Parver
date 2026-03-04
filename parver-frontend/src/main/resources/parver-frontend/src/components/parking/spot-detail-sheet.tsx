import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReleaseForm } from "@/components/parking/release-form"
import { BookingForm } from "@/components/parking/booking-form"
import { ReportDialog } from "@/components/parking/report-dialog"
import { useAuth } from "@/hooks/use-auth"
import { parkingApi } from "@/lib/api"
import type { components } from "@/lib/api-types"
import { Flag, Trash2 } from "lucide-react"

type ParkingSpace = components["schemas"]["ParkingSpace"]
type ParkingSpotRelease = components["schemas"]["ParkingSpotRelease"]

interface SpotDetailSheetProps {
  spot: ParkingSpace | null
  onClose: () => void
}

const STATUS_LABELS: Record<string, string> = {
  INACTIVE: "Inaktiv",
  OCCUPIED: "Belegt",
  AVAILABLE: "Verfügbar",
  BOOKED: "Gebucht",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  INACTIVE: "secondary",
  OCCUPIED: "destructive",
  AVAILABLE: "default",
  BOOKED: "destructive",
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SpotDetailSheet({ spot, onClose }: SpotDetailSheetProps) {
  const { user } = useAuth()
  const [liveSpot, setLiveSpot] = useState<ParkingSpace | null>(spot)
  const [reportOpen, setReportOpen] = useState(false)

  const isOwner = user && spot && spot.ownerId === user.id
  const canBook = user && user.parkingSpotNumber === null && !isOwner

  const refreshSpot = useCallback(async () => {
    if (!spot) return
    try {
      const response = await parkingApi.getParkingSpaces()
      if (response.ok) {
        const spaces: ParkingSpace[] = await response.json()
        const updated = spaces.find((s) => s.spotNumber === spot.spotNumber)
        if (updated) setLiveSpot(updated)
      }
    } catch {
      // ignore
    }
  }, [spot])

  useEffect(() => {
    setLiveSpot(spot)
    if (spot) refreshSpot()
  }, [spot, refreshSpot])

  const handleDeleteRelease = async (releaseId: number) => {
    if (!liveSpot) return
    await parkingApi.deleteRelease(liveSpot.spotNumber, releaseId)
    refreshSpot()
  }

  const handleDeleteBooking = async (bookingId: number, releaseSpotNumber: number) => {
    await parkingApi.deleteBooking(releaseSpotNumber, bookingId)
    refreshSpot()
  }

  const activeReleases: ParkingSpotRelease[] = liveSpot?.activeReleases ?? []

  return (
    <Dialog open={spot !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Parkplatz {liveSpot?.spotNumber}
            {liveSpot && (
              <Badge variant={STATUS_VARIANTS[liveSpot.status]}>
                {STATUS_LABELS[liveSpot.status]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {liveSpot && (
          <div className="space-y-4">
            {/* Owner info */}
            {liveSpot.ownerDisplayName ? (
              <p className="text-sm text-muted-foreground">
                Inhaber: <span className="font-medium text-foreground">{liveSpot.ownerDisplayName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Kein Inhaber zugewiesen.</p>
            )}

            {/* Current booker */}
            {liveSpot.status === "BOOKED" && liveSpot.currentBookerDisplayName && (
              <p className="text-sm text-muted-foreground">
                Gebucht von: <span className="font-medium text-foreground">{liveSpot.currentBookerDisplayName}</span>
              </p>
            )}

            {/* Active releases list */}
            {activeReleases.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Aktive Freigaben</h4>
                {activeReleases.map((release) => (
                  <div key={release.id} className="rounded-md border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>
                        {formatDateTime(release.availableFrom)} – {formatDateTime(release.availableTo)}
                      </span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDeleteRelease(release.id)}
                          title="Freigabe löschen"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {/* Bookings within this release */}
                    {release.bookings && release.bookings.length > 0 && (
                      <div className="mt-1.5 space-y-1 border-t pt-1.5">
                        {release.bookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between text-muted-foreground">
                            <span>
                              {booking.bookedByDisplayName}: {formatDateTime(booking.bookedFrom)} – {formatDateTime(booking.bookedTo)}
                            </span>
                            {(user?.id === booking.bookedById || user?.role === "ADMIN") && (
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleDeleteBooking(booking.id, release.spotNumber)}
                                title="Buchung stornieren"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Release form for owner */}
            {isOwner && (
              <div className="border-t pt-3">
                <ReleaseForm spotNumber={liveSpot.spotNumber} onCreated={refreshSpot} />
              </div>
            )}

            {/* Booking form for non-owners */}
            {canBook && activeReleases.length > 0 && (
              <div className="border-t pt-3">
                <BookingForm
                  spotNumber={liveSpot.spotNumber}
                  releases={activeReleases}
                  onBooked={refreshSpot}
                />
              </div>
            )}

            {/* Report misuse button for non-owners on available/booked spots */}
            {!isOwner && (liveSpot.status === "AVAILABLE" || liveSpot.status === "BOOKED") && (
              <div className="border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="h-4 w-4" />
                  Fehlbelegung melden
                </Button>
              </div>
            )}
          </div>
        )}

        {liveSpot && (
          <ReportDialog
            spotNumber={reportOpen ? liveSpot.spotNumber : null}
            onOpenChange={(open) => { if (!open) setReportOpen(false) }}
            onReported={() => setReportOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
