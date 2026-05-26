from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import Setlist, SetlistCreate, SetlistSong, SetlistSongOut

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

@router.get("/songs/", response_model=list[SetlistSongOut])
def get_setlist_songs(band_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SetlistSong)
        .filter(SetlistSong.band_id == band_id)
        .options(joinedload(SetlistSong.song))
        .all()
    )
