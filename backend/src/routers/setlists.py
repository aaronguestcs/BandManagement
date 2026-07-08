from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import Setlist, SetlistCreate, SetlistUpdate, SetlistSong, SetlistSongCreate, SetlistSongOut, SetlistReorder, Gig

router = APIRouter(prefix="/setlists", tags=["setlists"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_setlist(payload: SetlistCreate, db: Session = Depends(get_db)):
    setlist = Setlist(name=payload.name, band_id=payload.band_id)
    db.add(setlist)
    db.commit()
    db.refresh(setlist)
    return setlist

@router.get("/")
def get_setlists(band_id: int, db: Session = Depends(get_db)):
    return db.query(Setlist).filter(Setlist.band_id == band_id).all()

@router.get("/{setlist_id}")
def get_setlist(setlist_id: int, db: Session = Depends(get_db)):
    return db.query(Setlist).filter(Setlist.id == setlist_id).first()

@router.put("/{setlist_id}")
def update_setlist(setlist_id: int, payload: SetlistUpdate, db: Session = Depends(get_db)):
    setlist = db.query(Setlist).filter(Setlist.id == setlist_id).first()
    if setlist is None:
        raise HTTPException(status_code=404, detail="Setlist not found")
    setlist.name = payload.name
    db.commit()      
    db.refresh(setlist) 
    return setlist

@router.delete("/{setlist_id}")
def delete_setlist(setlist_id: int, db: Session = Depends(get_db)):
    # Remove child SetlistSong rows and clear the FK on any gig pointing here,
    db.query(SetlistSong).filter(SetlistSong.setlist_id == setlist_id).delete()
    db.query(Gig).filter(Gig.setlist_id == setlist_id).update({"setlist_id": None})
    db.query(Setlist).filter(Setlist.id == setlist_id).delete()
    db.commit()
    return {"ok": True}

@router.get("/songs/", response_model=list[SetlistSongOut])
def get_setlist_songs(band_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SetlistSong)
        .filter(SetlistSong.band_id == band_id)
        .options(joinedload(SetlistSong.song))
        .all()
    )

@router.post("/{setlist_id}/songs")
def add_song_to_setlist(setlist_id: int, payload: SetlistSongCreate, db: Session = Depends(get_db)):
    position = db.query(SetlistSong).filter(SetlistSong.setlist_id == setlist_id).count() + 1
    entry = SetlistSong(
        setlist_id=setlist_id,
        song_id=payload.song_id,
        band_id=payload.band_id,
        position=position,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.put("/{setlist_id}/reorder")
def reorder_setlist_songs(setlist_id: int, payload: SetlistReorder, db: Session = Depends(get_db)):
    # Updates order by taking indexed position from frontend and applying to the SetlistSong rows in DB.
    for index, ss_id in enumerate(payload.ordered_ids):
        db.query(SetlistSong).filter(
            SetlistSong.id == ss_id,
            SetlistSong.setlist_id == setlist_id,
        ).update({"position": index})
    db.commit() 
    return {"ok": True}

@router.delete("/{setlist_id}/songs/{setlist_song_id}")
def remove_song_from_setlist(setlist_id: int, setlist_song_id: int, db: Session = Depends(get_db)):
    # Deletes by setlistsong id to allow for duplicate songs in a setlist
    entry = db.query(SetlistSong).filter(
        SetlistSong.setlist_id == setlist_id,
        SetlistSong.id == setlist_song_id,
    ).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"ok": True}
