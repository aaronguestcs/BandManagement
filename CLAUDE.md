# CLAUDE.md — Band Management Platform

## Project Context

This is a full-stack Band Management Platform — the developer's first serious architecture-based application, built as a portfolio piece for software engineering / AI-adjacent internship applications at UNC Chapel Hill (sophomore year, applying fall semester).

The developer is actively learning React, FastAPI, PostgreSQL, and full-stack patterns. This project is the bridge from beginner React work into real full-stack engineering experience. Prioritize teaching and clarity alongside correctness.

---

## Teaching & Explanation Style

- **Always break down concepts** before or alongside code — don't just produce code silently.
- When writing code examples, use **band/music domain names** naturally (e.g., `song`, `setlist`, `gig`, `band`, `member`) rather than generic placeholders like `item`, `foo`, or `data`. Do NOT use music metaphors to explain abstract concepts.
- When introducing a new pattern (e.g. ORM relationships, JWT auth flow), explain **why** it exists before **how** to implement it.
- Break architecture explanations into layers: Frontend → API layer → Backend → Database.

---

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React + Vite                      |
| Styling        | Tailwind CSS + shadcn/ui          |
| Backend        | FastAPI (Python)                  |
| ORM            | SQLAlchemy                        |
| Database       | PostgreSQL                        |
| Auth           | TBD (likely JWT-based)            |
| Deployment     | TBD                               |

---

## Application Architecture Overview

```
[ React Frontend (Vite) ]
        |
        | HTTP requests (fetch / axios)
        v
[ FastAPI Backend ]
        |
        | SQLAlchemy ORM queries
        v
[ PostgreSQL Database ]
```

The frontend is a single-page application (SPA). It calls the FastAPI backend via REST endpoints. The backend uses SQLAlchemy to translate Python objects into SQL queries against PostgreSQL.

---

## Core Data Models (MVP)

These are the main entities and how they relate:

```
User
 └── owns → Band
              ├── has many → Members
              ├── has many → Songs       (Song Library)
              ├── has many → Setlists
              │              └── has many → SetlistSongs (join table, ordered)
              └── has many → Gigs
                             └── assigned → Setlist
```

### Key fields to remember:

**Song**
- `title`, `artist`, `key`, `bpm`, `duration`, `notes`
- This is the **core dataset** — Songs power Setlists, which power Gigs.

**Setlist**
- Contains an **ordered** list of Songs (ordering matters for drag-and-drop)
- Should calculate total duration from its songs

**Gig**
- Has a `venue`, `date/time`, and an assigned `Setlist`

---

## MVP Features

1. **Authentication** — Sign up, log in, log out. User owns their band's data.
2. **Band Dashboard** — Central home view: band name, upcoming gigs, active setlists, song count.
3. **Member Management** — Add/edit members with instruments and roles. CRUD practice.
4. **Song Library** — Add/edit/delete/search songs. The foundational dataset.
5. **Setlist Builder** — Create setlists, add songs, reorder via drag-and-drop, show total duration. **Standout visual feature.**
6. **Gig Manager** — Create gigs, assign venue + date, attach a setlist.

---

## Frontend Conventions

- Components live in `src/components/`, pages in `src/pages/`
- Use `shadcn/ui` components as the base UI library
- Tailwind for all custom styling — avoid writing raw CSS unless necessary
- Use `useEffect` + `fetch` (or axios) for API calls
- Lift state up when multiple components need the same data
- The Setlist Builder will require drag-and-drop state management — treat song order as a piece of React state (an ordered array of song IDs)

---

## UI & Styling Conventions

Established in `SongLibraryPage.jsx`. Follow these patterns on all pages for visual consistency.

### Page shell
- Outermost wrapper: `max-w-4xl`
- Header row: `flex items-center justify-between mb-6`
- Page title: `text-3xl font-bold`
- Primary header action button: `variant="outline"`

### Tables
- Table: `w-full text-sm`
- Header row: `border-b text-left text-gray-500`, cells: `pb-2 font-medium`
- Data rows: `border-b last:border-0 hover:bg-gray-50`
- Primary cell (title/name): `py-3 font-medium`
- Secondary cells: `py-3 text-gray-600`
- Destructive row action: `text-xs text-red-400 hover:text-red-600 transition-colors`
- Empty state: `text-gray-400 text-sm`

### Dialogs
- Dialog width: `max-w-md`
- Form body spacing: `space-y-4 pt-2`
- Field label: `text-sm font-medium text-gray-700`
- Field wrapper: `space-y-1`
- Compact multi-field row: `grid grid-cols-3 gap-3`
- Action button row: `flex gap-2 pt-2` — primary button gets `flex-1`, cancel is `variant="outline"`

### Dropdowns / overlays
- Container: `relative max-w-lg mb-8`
- Dropdown panel: `absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden`
- Dropdown row: `flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 transition-colors`

### Color palette
| Use | Class |
|-----|-------|
| Muted / empty state text | `text-gray-400` |
| Secondary / supporting text | `text-gray-600` |
| Labels | `text-gray-700` |
| Table / column headers | `text-gray-500` |
| Destructive action | `text-red-400 hover:text-red-600` |
| Row hover | `hover:bg-gray-50` |
| Overlay borders | `border-gray-200` |

---

## Backend Conventions

- FastAPI routers should be grouped by resource: `/auth`, `/bands`, `/members`, `/songs`, `/setlists`, `/gigs`
- Use SQLAlchemy ORM models — avoid raw SQL unless explaining a concept
- Return consistent JSON shapes from all endpoints
- Use Pydantic schemas for request validation and response serialization
- Auth middleware should protect all routes except `/auth/signup` and `/auth/login`

---

## Developer Background & Learning Goals

The developer currently understands:
- Python reasonably well
- Basic SQL concepts
- React fundamentals: state, props, hooks, `useEffect`, async API calls

This project is explicitly intended to build experience in:
- Full-stack architecture patterns
- Relational database design
- Authentication flows
- Scalable, organized code structure
- Deploying a production-ready app

When answering questions, **assume the developer is learning**, not just shipping. Explain tradeoffs. Flag when something is "advanced but good to know" vs "essential for MVP."

---

## Reminders

- Keep MVP scope tight — resist feature creep.
- The Setlist Builder drag-and-drop is the **hero feature** for recruiters. It demonstrates UI state management and dynamic rendering.
- The developer is applying for internships starting August — polish and completeness matter.
- When in doubt, build the simple version first and note how it could be extended.
