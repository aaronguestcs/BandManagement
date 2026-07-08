# Band Manager Web App

Band Manager makes it easy for smaller-scale bands to track necessary and important data, such as their finances, past/future gigs, setlists, and song rotation. 

## Demo Link
[Band Manager](https://band-management-pied.vercel.app)

<img width="2555" height="759" alt="BMAppGigsSS" src="https://github.com/user-attachments/assets/4dc82416-fb2e-4184-8275-91d1d4da07dc" />

## Features
- Add and delete songs from your band's rotation
- Create and reorder setlists from your song library
- Manage gig dates, venues, setlists, and finances

## Tech Stack
- Frontend: React + Shadcn & Tailwind CSS for styling
- Backend: FastAPI + SQLAlchemy
- Database: Supabase (Postgres)
- Deployment: Vercel (frontend), Render (backend)

## Architecture
The React-powered frontend authenticates its session by validating a stored JWT at the /users/me endpoint. Data endpoints currently identify the user/band by id. The backend is FastAPI + SQLAlchemy running CRUD operations against Supabase (running Postgres) via SQLAlchemy's ORM. The frontend's tables, dialog pop-ups, and date-pickers use Shadcn components, with Tailwind CSS styling the rest of the components.

## Data Model
```mermaid
erDiagram
    USER ||--o{ BAND : owns
    BAND ||--o{ SONG : has
    BAND ||--o{ SETLIST : has
    BAND ||--o{ GIG : books
    BAND ||--o{ SETLIST_SONG : has
    SETLIST ||--o{ SETLIST_SONG : contains
    SONG ||--o{ SETLIST_SONG : appears_in
    SETLIST ||--o{ GIG : used_by

    USER {
        int id PK
        string username
        string email
        string hashed_password
    }
    BAND {
        int id PK
        string name
        int user_id FK
    }
    SONG {
        int id PK
        string title
        string artist
        string key
        int bpm
        string duration
        string notes
        string added_at
        string last_played_at
        int band_id FK
    }
    SETLIST {
        int id PK
        string name
        int band_id FK
    }
    SETLIST_SONG {
        int id PK
        int setlist_id FK
        int song_id FK
        int position
        int band_id FK
    }
    GIG {
        int id PK
        string date_time
        string venue
        int pay
        string gig_duration
        string notes
        int band_id FK
        int setlist_id FK
    }
```

- *One setlist can be reused across multiple gigs — gigs store a reference to their setlist, not the reverse.*

- *SetlistSongs reference Songs by FK, allowing multiple of the same song to be on a given setlist without issue. The Pydantic response schema then embeds the Song onto the SetlistSong as a property (ex. 'setlistSong.song.artist' becomes a valid path).*


## What I'd Do Next
- Improve auth to gate data endpoints by Bearer Token
- Allow multiple users to access the same band
- Implement an analytics page for finances and gigs (highest-paying venue, average hourly rate, etc.)
- Allow for imports/exports of setlist data from Spotify or other music platforms
