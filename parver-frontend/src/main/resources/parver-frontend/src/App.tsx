import { Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ParkingPage from "@/pages/ParkingPage"
import LoginPage from "@/pages/LoginPage"
import SetupPage from "@/pages/SetupPage"
import AdminPage from "@/pages/AdminPage"
import ReportsPage from "@/pages/ReportsPage"
import ErrorPage from "@/pages/ErrorPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/administration/setup" element={<SetupPage />} />
      <Route
        path="/administration/users"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration/reports"
        element={
          <ProtectedRoute requireAdmin={true}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ParkingPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}

export default App
