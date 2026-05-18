import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import AppLayout from "./components/layout/AppLayout"
import DashboardPage from "./pages/DashboardPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}