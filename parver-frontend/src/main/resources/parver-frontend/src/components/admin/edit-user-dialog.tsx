import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usersApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { components } from "@/lib/api-types"

type UserResponse = components["schemas"]["UserResponse"]

const PARKING_SPOTS = [53, 54, 55, 56, 57, 58, 59, 60, 61]

interface EditUserDialogProps {
  user: UserResponse | null
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
  assignedSpots: number[]
}

export function EditUserDialog({
  user,
  onOpenChange,
  onUpdated,
  assignedSpots,
}: EditUserDialogProps) {
  const { user: authUser } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [parkingSpot, setParkingSpot] = useState<string>("none")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSelf = user !== null && authUser !== null && user.id === authUser.id

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName)
      setPassword("")
      setRole(user.role)
      setParkingSpot(user.parkingSpotNumber != null ? String(user.parkingSpotNumber) : "none")
      setError(null)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)

    if (!displayName.trim()) {
      setError("Anzeigename darf nicht leer sein.")
      return
    }

    setSubmitting(true)
    try {
      const data: {
        displayName: string
        password?: string
        role: "ADMIN" | "USER"
        parkingSpotNumber?: number | null
      } = {
        displayName: displayName.trim(),
        role,
        parkingSpotNumber: parkingSpot === "none" ? null : parseInt(parkingSpot),
      }
      if (password.trim()) {
        data.password = password
      }

      const response = await usersApi.update(user.id, data)
      if (response.ok) {
        onOpenChange(false)
        onUpdated()
      } else {
        const text = await response.text()
        let body: { message?: string; detail?: string } = {}
        try { body = JSON.parse(text) } catch { /* empty */ }
        setError(body.message || body.detail || "Benutzer konnte nicht aktualisiert werden.")
      }
    } catch {
      setError("Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.")
    } finally {
      setSubmitting(false)
    }
  }

  // Allow the user's own current spot + all unassigned spots
  const availableSpots = PARKING_SPOTS.filter(
    (s) => !assignedSpots.includes(s) || s === user?.parkingSpotNumber,
  )

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Benutzer bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Benutzername</Label>
            <Input value={user?.username ?? ""} disabled />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-displayname">Anzeigename</Label>
            <Input
              id="edit-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-password">Passwort</Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leer lassen, um nicht zu ändern"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <Label>Rolle</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "ADMIN" | "USER")}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Benutzer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                Eigene Rolle kann nicht geändert werden.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Parkplatz</Label>
            <Select value={parkingSpot} onValueChange={setParkingSpot}>
              <SelectTrigger>
                <SelectValue placeholder="Kein Parkplatz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Parkplatz</SelectItem>
                {availableSpots.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    Parkplatz {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Speichere\u2026" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
