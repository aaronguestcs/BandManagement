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
  const [loggedIn, setLoggedIn] = useState(true)
  const [bandCreated, setBandCreated] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    // Check for band creation status via FastAPI call
    fetch(`${API}/band-created`)
      .then(response => response.json())
      .then(data => {
        if (data.band_created) {
          setBandCreated(true);
        }
      })
      .catch(error => {
        console.error("Error checking band creation status:", error);
      });
  }, []);

  useEffect(() => {
    if (!loggedIn) return

    // Fetch user data (including band info) on app load
    fetch(`${API}/users/${USER_ID()}`)
      .then(response => response.json())
      .then(data => {
        setUserData(data)
      })
      .catch(error => {
        console.error("Error fetching user data:", error);
      });
  }, []);

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
          </Route>
        ) : (
          <>
            <Route path="create-band" element={<BandCreationPage setBandCreated={setBandCreated} />} />
            <Route path="*" element={<Navigate to="/create-band" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}