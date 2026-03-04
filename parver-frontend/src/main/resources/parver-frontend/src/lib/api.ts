const BASE_URL = "/api"

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem("parver_access_token")
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("parver_refresh_token")
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("parver_access_token", accessToken)
    localStorage.setItem("parver_refresh_token", refreshToken)
  }

  clearTokens(): void {
    localStorage.removeItem("parver_access_token")
    localStorage.removeItem("parver_refresh_token")
  }

  hasTokens(): boolean {
    return this.getAccessToken() !== null
  }

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    let response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        headers["Authorization"] = `Bearer ${this.getAccessToken()}`
        response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      }
    }

    return response
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      this.clearTokens()
      return false
    }

    const data = await response.json()
    this.setTokens(data.accessToken, data.refreshToken)
    return true
  }
}

export const apiClient = new ApiClient()

// Typed API helpers
export const parkingApi = {
  getParkingSpaces: () => apiClient.fetch("/parking-spaces"),

  createRelease: (spotNumber: number, availableFrom: string, availableTo: string) =>
    apiClient.fetch(`/parking-spaces/${spotNumber}/releases`, {
      method: "POST",
      body: JSON.stringify({ availableFrom, availableTo }),
    }),

  deleteRelease: (spotNumber: number, releaseId: number) =>
    apiClient.fetch(`/parking-spaces/${spotNumber}/releases/${releaseId}`, {
      method: "DELETE",
    }),

  createBooking: (spotNumber: number, releaseId: number, bookedFrom: string, bookedTo: string) =>
    apiClient.fetch(`/parking-spaces/${spotNumber}/bookings`, {
      method: "POST",
      body: JSON.stringify({ releaseId, bookedFrom, bookedTo }),
    }),

  deleteBooking: (spotNumber: number, bookingId: number) =>
    apiClient.fetch(`/parking-spaces/${spotNumber}/bookings/${bookingId}`, {
      method: "DELETE",
    }),
}

export const reportsApi = {
  create: (spotNumber: number, comment?: string) =>
    apiClient.fetch(`/parking-spaces/${spotNumber}/reports`, {
      method: "POST",
      body: JSON.stringify({ comment: comment || undefined }),
    }),

  getAll: () => apiClient.fetch("/reports"),

  updateStatus: (reportId: number, status: "RESOLVED" | "DISMISSED") =>
    apiClient.fetch(`/reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
}

export const usersApi = {
  getAll: () => apiClient.fetch("/users"),

  create: (data: {
    username: string
    displayName: string
    password: string
    role: "ADMIN" | "USER"
    parkingSpotNumber?: number | null
  }) =>
    apiClient.fetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    userId: number,
    data: {
      displayName: string
      password?: string
      role: "ADMIN" | "USER"
      parkingSpotNumber?: number | null
    },
  ) =>
    apiClient.fetch(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (userId: number) =>
    apiClient.fetch(`/users/${userId}`, {
      method: "DELETE",
    }),
}
