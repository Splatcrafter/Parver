import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Check, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { reportsApi } from "@/lib/api"
import type { components } from "@/lib/api-types"

type ParkingSpotReport = components["schemas"]["ParkingSpotReport"]

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  RESOLVED: "Gelöst",
  DISMISSED: "Abgelehnt",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  OPEN: "destructive",
  RESOLVED: "default",
  DISMISSED: "secondary",
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

export default function ReportsPage() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<ParkingSpotReport[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      const response = await reportsApi.getAll()
      if (response.ok) {
        setReports(await response.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const handleUpdateStatus = async (reportId: number, status: "RESOLVED" | "DISMISSED") => {
    const response = await reportsApi.updateStatus(reportId, status)
    if (response.ok) {
      fetchReports()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <Button variant="ghost" size="icon-sm" asChild title="Zurück">
            <Link to="/administration/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Meldungen</h1>
          <p className="text-sm text-muted-foreground">
            Fehlbelegungen einsehen und bearbeiten
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {authUser?.displayName}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="Abmelden">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reports Table */}
      <motion.div
        className="mt-6 w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Laden&hellip;</p>
        ) : reports.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Keine Meldungen vorhanden.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parkplatz</TableHead>
                  <TableHead>Gemeldet von</TableHead>
                  <TableHead>Kommentar</TableHead>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.spotNumber}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reporterDisplayName}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {r.comment || "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "OPEN" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleUpdateStatus(r.id, "RESOLVED")}
                            title="Als gelöst markieren"
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleUpdateStatus(r.id, "DISMISSED")}
                            title="Ablehnen"
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

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
