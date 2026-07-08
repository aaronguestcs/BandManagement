from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import Setlist, SetlistCreate, SetlistUpdate, SetlistSong, SetlistSongCreate, SetlistSongOut, SetlistReorder

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
        # 404 tells the client the id doesn't exist, vs silently doing nothing.
        raise HTTPException(status_code=404, detail="Setlist not found")
    setlist.name = payload.name
    db.commit()       # persist the change
    db.refresh(setlist)  # reload so we return the updated row
    return setlist

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
    # Renumber every row from the incoming order. The array index becomes the
    # new position, so the client sends the whole desired order in one call.
    for index, ss_id in enumerate(payload.ordered_ids):
        db.query(SetlistSong).filter(
            SetlistSong.id == ss_id,
            SetlistSong.setlist_id == setlist_id,  # scope guard: only touch THIS setlist's rows
        ).update({"position": index})
    db.commit()  # one commit = one transaction for all N updates (all-or-nothing)
    return {"ok": True}

@router.delete("/{setlist_id}/songs/{song_id}")
def remove_song_from_setlist(setlist_id: int, song_id: int, db: Session = Depends(get_db)):
    entry = db.query(SetlistSong).filter(
        SetlistSong.setlist_id == setlist_id,
        SetlistSong.song_id == song_id,
    ).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"ok": True}
