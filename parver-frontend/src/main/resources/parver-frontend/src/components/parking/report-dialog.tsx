import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { reportsApi } from "@/lib/api"

interface ReportDialogProps {
  spotNumber: number | null
  onOpenChange: (open: boolean) => void
  onReported: () => void
}

export function ReportDialog({
  spotNumber,
  onOpenChange,
  onReported,
}: ReportDialogProps) {
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (spotNumber === null) return
    setError(null)
    setSubmitting(true)

    try {
      const response = await reportsApi.create(
        spotNumber,
        comment.trim() || undefined,
      )
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setComment("")
          onReported()
        }, 1500)
      } else {
        const text = await response.text()
        let body: { message?: string; detail?: string } = {}
        try { body = JSON.parse(text) } catch { /* empty */ }
        setError(body.message || body.detail || "Meldung konnte nicht erstellt werden.")
      }
    } catch {
      setError("Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setComment("")
      setError(null)
      setSuccess(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={spotNumber !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Fehlbelegung melden</DialogTitle>
        </DialogHeader>
        {success ? (
          <p className="py-4 text-center text-sm text-green-600">
            Meldung erfolgreich gesendet.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Parkplatz {spotNumber} ist im System als verfügbar markiert, aber in
              Wirklichkeit belegt? Melden Sie die Abweichung.
            </p>
            <div className="space-y-1">
              <Label htmlFor="report-comment">Kommentar (optional)</Label>
              <Textarea
                id="report-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="z.B. Schwarzer SUV steht dort"
                maxLength={500}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? "Sende\u2026" : "Melden"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
