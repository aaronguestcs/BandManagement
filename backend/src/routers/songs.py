from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import httpx

from database import SessionLocal
from models import Song, SongCreate, SetlistSong

router = APIRouter(prefix="/songs", tags=["songs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Deezer API song search --- 
@router.get("/search")
async def search_songs(q: str = Query(..., min_length=2)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.deezer.com/search",
            params={"q": q, "limit": 8},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Deezer API error")

    results = []
    for item in response.json().get("data", []):
        # Deezer gives duration in seconds; convert to the M:SS the form expects.
        secs = item.get("duration") or 0
        duration = f"{secs // 60}:{secs % 60:02d}" if secs else ""

        results.append({
            "deezer_id": item.get("id"),
            "title": item.get("title", ""),
            "artist": item.get("artist", {}).get("name", ""),
            "duration": duration,
            "thumb": item.get("album", {}).get("cover_small", ""),
        })

    return results


@router.get("/")
def list_songs(band_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(Song).filter(Song.band_id == band_id).all()


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


@router.put("/{song_id}")
def update_song(song_id: int, song_data: SongCreate, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    song.title = song_data.title
    song.artist = song_data.artist
    song.key = song_data.key
    song.bpm = song_data.bpm
    song.duration = song_data.duration
    song.notes = song_data.notes
    db.commit()
    db.refresh(song)
    return song


@router.delete("/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    # If a song is deleted, also delete any SetlistSong entries that have matching song ids.
    db.query(SetlistSong).filter(SetlistSong.song_id == song_id).delete()
    db.delete(song)
    db.commit()
    return {"ok": True}
