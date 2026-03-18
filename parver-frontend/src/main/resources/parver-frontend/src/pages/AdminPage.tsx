import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Flag, LogOut, Pencil, Plus, Trash2 } from "lucide-react"
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
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { useAuth } from "@/hooks/use-auth"
import { useOpenReportCount } from "@/hooks/use-open-report-count"
import { usersApi } from "@/lib/api"
import type { components } from "@/lib/api-types"

type UserResponse = components["schemas"]["UserResponse"]

export default function AdminPage() {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const openReportCount = useOpenReportCount()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserResponse | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersApi.getAll()
      if (response.ok) {
        setUsers(await response.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const assignedSpots = users
    .filter((u) => u.parkingSpotNumber != null)
    .map((u) => u.parkingSpotNumber!)

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <Button variant="ghost" size="icon-sm" asChild title="Zurück">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-sm text-muted-foreground">
            Benutzer und Parkplatzzuweisungen verwalten
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

      {/* Actions */}
      <div className="mt-6 flex w-full max-w-4xl justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link to="/administration/reports">
            <Flag className="h-4 w-4" />
            Meldungen
            {openReportCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
                +{openReportCount}
              </span>
            )}
          </Link>
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Benutzer erstellen
        </Button>
      </div>

      {/* User Table */}
      <motion.div
        className="mt-4 w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Laden&hellip;</p>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Keine Benutzer gefunden.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anzeigename</TableHead>
                  <TableHead>Benutzername</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Parkplatz</TableHead>
                  <TableHead className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role === "ADMIN" ? "Admin" : "Benutzer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.parkingSpotNumber != null ? u.parkingSpotNumber : "\u2014"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditUser(u)}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteUser(u)}
                          title="Löschen"
                          disabled={u.id === authUser?.id}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Dialogs */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchUsers}
        assignedSpots={assignedSpots}
      />
      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null) }}
        onUpdated={fetchUsers}
        assignedSpots={assignedSpots}
      />
      <DeleteUserDialog
        user={deleteUser}
        onOpenChange={(open) => { if (!open) setDeleteUser(null) }}
        onDeleted={fetchUsers}
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
