import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import AppLayout from "./components/layout/AppLayout"
import DashboardPage from "./pages/DashboardPage"
import SongLibraryPage from "./pages/SongLibraryPage"
import BandViewPage from "./pages/BandViewPage"
import GigsPage from './pages/GigsPage'
import SetlistsPage from './pages/SetlistsPage'



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="song-library" element={<SongLibraryPage/>}/>
          <Route path="band-view" element={<BandViewPage/>}/>
          <Route path="gigs" element={<GigsPage/>}/>
          <Route path="setlists" element={<SetlistsPage/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}