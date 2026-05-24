from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
# from models import BandCreate, Setlist, SetlistCreate, SetlistSong, SetlistSongCreate
from models import Setlist, SetlistCreate

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
