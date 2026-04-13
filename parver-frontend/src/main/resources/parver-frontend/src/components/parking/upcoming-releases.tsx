import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import type { components } from "@/lib/api-types"

type ParkingSpace = components["schemas"]["ParkingSpace"]

interface UpcomingReleasesProps {
  spaces: ParkingSpace[] | undefined
}

type ReleaseEntry = {
  releaseId: number
  spotNumber: number
  ownerDisplayName: string
  availableFrom: Date
  availableTo: Date
  hasBookings: boolean
}

type DayGroup = {
  dateKey: string
  label: string
  releases: ReleaseEntry[]
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
}

function formatDateTimeFull(date: Date): string {
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDayLabel(dateKey: string, date: Date): string {
  const now = new Date()
  const todayKey = toDateKey(now)

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = toDateKey(tomorrow)

  if (dateKey === todayKey) return "Heute"
  if (dateKey === tomorrowKey) return "Morgen"

  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function buildDayGroups(spaces: ParkingSpace[]): DayGroup[] {
  const now = new Date()
  const entries: ReleaseEntry[] = []

  for (const space of spaces) {
    if (!space.activeReleases) continue
    for (const release of space.activeReleases) {
      const availableTo = new Date(release.availableTo)
      if (availableTo <= now) continue

      entries.push({
        releaseId: release.id,
        spotNumber: release.spotNumber,
        ownerDisplayName: space.ownerDisplayName ?? "Unbekannt",
        availableFrom: new Date(release.availableFrom),
        availableTo,
        hasBookings: (release.bookings?.length ?? 0) > 0,
      })
    }
  }

  entries.sort((a, b) => a.availableFrom.getTime() - b.availableFrom.getTime())

  const groupMap = new Map<string, ReleaseEntry[]>()
  for (const entry of entries) {
    const key = toDateKey(entry.availableFrom)
    const group = groupMap.get(key)
    if (group) {
      group.push(entry)
    } else {
      groupMap.set(key, [entry])
    }
  }

  const groups: DayGroup[] = []
  for (const [dateKey, releases] of groupMap) {
    groups.push({
      dateKey,
      label: getDayLabel(dateKey, releases[0].availableFrom),
      releases,
    })
  }

  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  return groups
}

function formatReleaseTime(entry: ReleaseEntry, groupDateKey: string): string {
  const fromKey = toDateKey(entry.availableFrom)
  const toKey = toDateKey(entry.availableTo)

  if (fromKey === groupDateKey && toKey === groupDateKey) {
    return `${formatTime(entry.availableFrom)} – ${formatTime(entry.availableTo)}`
  }

  return `${formatDateTimeFull(entry.availableFrom)} – ${formatDateTimeFull(entry.availableTo)}`
}

export function UpcomingReleases({ spaces }: UpcomingReleasesProps) {
  const dayGroups = useMemo(() => {
    if (!spaces) return null
    return buildDayGroups(spaces)
  }, [spaces])

  if (dayGroups === null) return null

  return (
    <section>
      <h2 className="text-sm font-semibold">Kommende Freigaben</h2>

      {dayGroups.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Keine kommenden Freigaben vorhanden.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {dayGroups.map((group) => (
            <div key={group.dateKey}>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.releases.map((release) => (
                  <div
                    key={release.releaseId}
                    className={`rounded-md border p-3 text-sm ${release.hasBookings ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        Parkplatz {release.spotNumber}
                      </span>
                      {release.hasBookings && (
                        <Badge variant="secondary">Gebucht</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {release.ownerDisplayName}
                    </div>
                    <div className="mt-0.5 text-xs">
                      {formatReleaseTime(release, group.dateKey)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
