import { Routes, Route } from "react-router-dom"

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">ParVer</h1>
        <p className="mt-2 text-muted-foreground">Parkplatzverwaltungssystem</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App
