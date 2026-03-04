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

const PARKING_SPOTS = [53, 54, 55, 56, 57, 58, 59, 60, 61]

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  assignedSpots: number[]
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
  assignedSpots,
}: CreateUserDialogProps) {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "USER">("USER")
  const [parkingSpot, setParkingSpot] = useState<string>("none")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setUsername("")
      setDisplayName("")
      setPassword("")
      setRole("USER")
      setParkingSpot("none")
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !displayName.trim() || !password.trim()) {
      setError("Bitte alle Pflichtfelder ausfüllen.")
      return
    }

    setSubmitting(true)
    try {
      const response = await usersApi.create({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
        role,
        parkingSpotNumber: parkingSpot === "none" ? null : parseInt(parkingSpot),
      })
      if (response.status === 201 || response.ok) {
        onOpenChange(false)
        onCreated()
      } else {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          setError(data.message || data.detail || "Benutzer konnte nicht erstellt werden.")
        } catch {
          setError("Benutzer konnte nicht erstellt werden.")
        }
      }
    } catch {
      setError("Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.")
    } finally {
      setSubmitting(false)
    }
  }

  const availableSpots = PARKING_SPOTS.filter((s) => !assignedSpots.includes(s))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Benutzer erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="create-username">Benutzername</Label>
            <Input
              id="create-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-displayname">Anzeigename</Label>
            <Input
              id="create-displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="create-password">Passwort</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "USER")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Benutzer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
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
              {submitting ? "Erstelle\u2026" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
