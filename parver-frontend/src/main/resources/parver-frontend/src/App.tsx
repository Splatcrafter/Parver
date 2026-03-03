import { Routes, Route } from "react-router-dom"
import PlaceholderPage from "@/pages/PlaceholderPage"
import ErrorPage from "@/pages/ErrorPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage title="ParVer" />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  )
}

export default App
