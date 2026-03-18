import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true })
      return
    }

    apiClient
      .fetch("/setup/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.setupRequired) {
          navigate("/administration/setup", { replace: true })
        }
      })
      .catch(() => {})
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await login(username, password)
      navigate("/", { replace: true })
    } catch {
      setError("Benutzername oder Passwort ist falsch.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">ParVer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parkplatzverwaltung &ndash; AFBB
          </p>
          <p className="mt-2 text-xs italic text-muted-foreground/70">
            &bdquo;Ich steh auf deinen Parkplatz&ldquo;
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-center text-lg font-semibold">Anmelden</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium"
              >
                Benutzername
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !username || !password}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {isSubmitting ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} Splatgames.de Software
        </p>
      </motion.div>
    </div>
  )
}
