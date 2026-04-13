import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import { apiClient } from "@/lib/api"

interface User {
  id: number
  username: string
  displayName: string
  role: "ADMIN" | "USER"
  parkingSpotNumber: number | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleProactiveRefresh = useCallback((expiresIn: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    const delayMs = Math.max((expiresIn - 60) * 1000, 10_000)
    refreshTimerRef.current = setTimeout(async () => {
      const success = await apiClient.tryRefresh()
      if (!success) {
        setUser(null)
      }
    }, delayMs)
  }, [])

  // Subscribe to token refresh events for proactive timer rescheduling
  useEffect(() => {
    const unsubscribe = apiClient.onTokenRefreshed(scheduleProactiveRefresh)
    return () => {
      unsubscribe()
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [scheduleProactiveRefresh])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.fetch("/auth/me")
      if (response.ok) {
        setUser(await response.json())
        const exp = apiClient.getAccessTokenExpiry()
        if (exp) {
          const remainingSeconds = exp - Math.floor(Date.now() / 1000)
          scheduleProactiveRefresh(remainingSeconds)
        }
      } else {
        apiClient.clearTokens()
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [scheduleProactiveRefresh])

  useEffect(() => {
    if (apiClient.hasTokens()) {
      fetchCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [fetchCurrentUser])

  // Re-validate when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return
      if (!apiClient.hasTokens()) return

      const exp = apiClient.getAccessTokenExpiry()
      if (exp) {
        const remainingSeconds = exp - Math.floor(Date.now() / 1000)
        if (remainingSeconds < 60) {
          const success = await apiClient.tryRefresh()
          if (!success) {
            setUser(null)
            return
          }
        }
      }

      try {
        const response = await apiClient.fetch("/auth/me")
        if (response.ok) {
          setUser(await response.json())
        } else {
          setUser(null)
        }
      } catch {
        // Network error - don't log out
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const login = async (username: string, password: string) => {
    const response = await apiClient.fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      throw new Error("Login fehlgeschlagen")
    }
    const data = await response.json()
    apiClient.setTokens(data.accessToken, data.refreshToken, data.expiresIn)
    setUser(data.user)
  }

  const logout = () => {
    apiClient.clearTokens()
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        isAdmin: user?.role === "ADMIN",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
