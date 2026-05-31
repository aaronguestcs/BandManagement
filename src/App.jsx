import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import AppLayout from "./components/layout/AppLayout"
import DashboardPage from "./pages/DashboardPage"
import SongLibraryPage from "./pages/SongLibraryPage"
import BandViewPage from "./pages/BandViewPage"
import GigsPage from './pages/GigsPage'
import SetlistsPage from './pages/SetlistsPage'
import SetlistBuilderPage from './pages/SetlistBuilderPage'
import BandCreationPage from "./pages/BandCreationPage"
import AccountCreationPage from "./pages/AccountCreationPage"

const DEV_USER = true

const API = "http://localhost:8000"

export default function App() {
  const [bandCreated, setBandCreated] = useState(true)
  const [bandId, setBandId] = useState(null)
  const [userCreated, setUserCreated] = useState(true)
  const [userId, setUserId] = useState(null)

  function getId() {
    if (DEV_USER) {
      setUserCreated(true) // Placeholder until auth is implemented — assume user is created and logged in
      return 1
    }
    else {
      // TODO: Implement real authentication flow and set userId accordingly
      return null
    }
  }

  useEffect(() => {
    const resolvedId = getId()
    setUserId(resolvedId)
    try {
      fetch(`${API}/bands/?user_id=${resolvedId}`)
        .then(res => res.json())
        .then(bands => {
          bands[0] ? (setBandCreated(true), setBandId(bands[0].id)) : setBandCreated(false)
        })
    } catch (err) {
      console.error("Error checking band status:", err)
    }
  }, [])

  // TODO: Route to login page if not logged in, and handle authentication flow
  return (
    <BrowserRouter>
      <Routes>
        {!userCreated ? (
          <>
            <Route path="create-account" element={<AccountCreationPage />} />
            <Route path="*" element={<Navigate to="/create-account" replace />} />
          </>
        ) : bandCreated ? (
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage userId={userId} API={API} />} />
            <Route path="song-library" element={<SongLibraryPage userId={userId} API={API} />} />
            <Route path="band-view" element={<BandViewPage userId={userId} API={API} />} />
            <Route path="gigs" element={<GigsPage userId={userId} API={API} />} />
            <Route path="setlists" element={<SetlistsPage bandId={bandId} API={API} />} />
            <Route path="setlists/:id" element={<SetlistBuilderPage bandId={bandId} API={API} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <>
            <Route path="create-band" element={<BandCreationPage setBandCreated={() => setBandCreated(true)} bandCreated={bandCreated} userId={userId} API={API} />} />
            <Route path="*" element={<Navigate to="/create-band" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}