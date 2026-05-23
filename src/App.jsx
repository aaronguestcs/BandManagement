import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import AppLayout from "./components/layout/AppLayout"
import DashboardPage from "./pages/DashboardPage"
import SongLibraryPage from "./pages/SongLibraryPage"
import BandViewPage from "./pages/BandViewPage"
import GigsPage from './pages/GigsPage'
import SetlistsPage from './pages/SetlistsPage'
import BandCreationPage from "./pages/BandCreationPage"

const DEV_USER = true

const API = "http://localhost:8000"
const USER_ID = () => {
  const id = (DEV_USER ? 1 : null) // TODO: Replace with actual user ID retrieval logic (e.g., from cookies or auth context)
  return id
}

export default function App() {
  const [bandCreated, setBandCreated] = useState(true)

  useEffect(() => {
    async function checkBandStatus() {
      try {
        const res = await fetch(`${API}/bands/?user_id=${USER_ID()}`)
        const bands = await res.json()
        setBandCreated((bands.length > 0))
      } catch (err) {
        console.error("Error checking band status:", err)
      }
    }
    checkBandStatus()
  }, [])

 // TODO: Route to login page if not logged in, and handle authentication flow
  return (
    <BrowserRouter>
      <Routes>
        {bandCreated ? (
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="song-library" element={<SongLibraryPage />} />
            <Route path="band-view" element={<BandViewPage />} />
            <Route path="gigs" element={<GigsPage />} />
            <Route path="setlists" element={<SetlistsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <>
            <Route path="create-band" element={<BandCreationPage setBandCreated={() => setBandCreated(true)} bandCreated={bandCreated} userId={USER_ID()} />} />
            <Route path="*" element={<Navigate to="/create-band" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}