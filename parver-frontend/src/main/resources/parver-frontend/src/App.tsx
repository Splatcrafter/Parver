import { Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import ErrorPage from "@/pages/ErrorPage"
import PlaceholderPage from "@/pages/PlaceholderPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/platzhalter" element={<PlaceholderPage title="Platzhalter" />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}

export default App
