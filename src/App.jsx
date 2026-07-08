import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import AppLayout from "./components/layout/AppLayout"
import AccountPage from "./pages/Accountpage"
import SongLibraryPage from "./pages/SongLibraryPage"
import GigsPage from './pages/GigsPage'
import SetlistsPage from './pages/SetlistsPage'
import SetlistBuilderPage from './pages/SetlistBuilderPage'
import BandCreationPage from "./pages/BandCreationPage"
import AccountCreationPage from "./pages/AccountCreationPage"

const API = "https://bandmanagement.onrender.com"

export default function App() {
  const [bandCreated, setBandCreated] = useState(false)
  const [bandId, setBandId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [bandName, setBandName] = useState("")
  const [authChecked, setAuthChecked] = useState(false)

  // Load the band for a user; flips bandCreated so routing knows where to send them.
  function loadBand(id) {
    return fetch(`${API}/bands/?user_id=${id}`)
      .then(res => res.json())
      .then(bands => {
        if (bands[0]) {
          setBandCreated(true)
          setBandName(bands[0].name)
          setBandId(bands[0].id)
        }
      })
  }

  // On load, if we have a stored token, validate it via /users/me and hydrate state.
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setAuthChecked(true); return }
    fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(user => { setUserId(user.id); return loadBand(user.id) })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setAuthChecked(true))
  }, [])

  // Called by AccountCreationPage after a successful register/login.
  function handleAuth({ access_token, user }) {
    localStorage.setItem("token", access_token)
    setUserId(user.id)
    loadBand(user.id)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    setUserId(null)
    setBandCreated(false)
    setBandId(null)
    setBandName("")
  }

  function handleBandCreated(band) {
    setBandName(band.name)
    setBandId(band.id)
    setBandCreated(true)
  }

  if (!authChecked) return null  // ponytail: brief blank while token is validated; swap for a spinner if you want

  return (
    <BrowserRouter>
      <Routes>
        {!userId ? (
          <>
            <Route path="create-account" element={<AccountCreationPage API={API} onAuth={handleAuth} />} />
            <Route path="*" element={<Navigate to="/create-account" replace />} />
          </>
        ) : bandCreated ? (
          <Route path="/" element={<AppLayout bandName={bandName} />}>
            <Route index element={<Navigate to="/account" replace />} />
            <Route path="account" element={<AccountPage userId={userId} API={API} onLogout={handleLogout} />} />
            <Route path="song-library" element={<SongLibraryPage userId={userId} API={API} />} />
            <Route path="gigs" element={<GigsPage bandId={bandId} API={API} />} />
            <Route path="setlists" element={<SetlistsPage bandId={bandId} API={API} />} />
            <Route path="setlists/:id" element={<SetlistBuilderPage bandId={bandId} API={API} />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Route>
        ) : (
          <>
            <Route path="create-band" element={<BandCreationPage onBandCreated={handleBandCreated} bandCreated={bandCreated} userId={userId} API={API} />} />
            <Route path="*" element={<Navigate to="/create-band" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}