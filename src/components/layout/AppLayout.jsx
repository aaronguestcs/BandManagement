import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { useState, useEffect } from "react"

export default function AppLayout({ bandName }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar bandName={bandName} />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}