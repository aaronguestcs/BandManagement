import { NavLink } from "react-router-dom"

export default function Sidebar({ bandName }) {
  return (
    <aside className="w-64 border-r p-4">
      <div>
        {bandName && <p className="text-lg font-semibold">{bandName}</p>}
      </div>
      <nav className="space-y-2">
        <NavLink to="/account">Account</NavLink>
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
    </aside>
  )
}