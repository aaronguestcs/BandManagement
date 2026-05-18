import { NavLink } from "react-router-dom"

export default function Sidebar() {
  return (
    <aside className="w-64 border-r p-4">
      <nav className="space-y-2">
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>
      <nav className="space-y-2">
        <NavLink to="song-library">Song Library</NavLink>
      </nav>
      <nav className="space-y-2">
        <NavLink to="setlists">Setlists</NavLink>
      </nav>
      <nav className="space-y-2">
        <NavLink to="gigs">Gigs</NavLink>
      </nav>
      <nav className="space-y-2">
        <NavLink to="band-view">Band View</NavLink>
      </nav>
    </aside>
  )
}