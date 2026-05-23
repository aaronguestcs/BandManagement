from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
import os

from database import SessionLocal
from models import Song, SongCreate

router = APIRouter(prefix="/songs", tags=["songs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Pydantic schema for creating a song ---
# Pydantic validates incoming JSON before it ever touches the database.
# Fields with None defaults are optional — useful for songs that don't have
# key/bpm data yet.

# --- Discogs search proxy ---
# We call Discogs from here (server-side) so the token never reaches the browser.
@router.get("/search")
async def search_discogs(q: str = Query(..., min_length=2)):
    token = os.getenv("DISCOGS_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="DISCOGS_TOKEN not set in environment")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.discogs.com/database/search",
            params={"q": q, "type": "master", "per_page": 8},
            headers={
                "Authorization": f"Discogs token={token}",
                # Discogs requires a descriptive User-Agent or requests get throttled
                "User-Agent": "BandManagementApp/1.0 +https://github.com/local/band-management",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Discogs API error")

    data = response.json()
    results = []

    for item in data.get("results", []):
        raw_title = item.get("title", "")

        # Discogs format is "Artist Name - Release Title".
        # We split on the first " - " to pre-fill the form fields.
        if " - " in raw_title:
            parts = raw_title.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip()
        else:
            artist = ""
            title = raw_title

        results.append({
            "discogs_id": item.get("id"),
            "title": title,
            "artist": artist,
            "year": item.get("year", ""),
            "thumb": item.get("thumb", ""),
        })

    return results


# --- List all songs for a band ---
@router.get("/")
def list_songs(band_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(Song).filter(Song.band_id == band_id).all()


# --- Add a song to the library ---
@router.post("/")
def create_song(song_data: SongCreate, db: Session = Depends(get_db)):
    song = Song(
        title=song_data.title,
        artist=song_data.artist,
        band_id=song_data.band_id,
        key=song_data.key,
        bpm=song_data.bpm,
        duration=song_data.duration,
        notes=song_data.notes,
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


# --- Delete a song ---
@router.delete("/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    db.delete(song)
    db.commit()
    return {"ok": True}
