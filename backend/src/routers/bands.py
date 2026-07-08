from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Band, BandCreate, BandUpdate

router = APIRouter(prefix="/bands", tags=["bands"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_band(payload: BandCreate, db: Session = Depends(get_db)):
    band = Band(name=payload.name, user_id=payload.user_id)
    db.add(band)
    db.commit()
    db.refresh(band)
    return band

@router.get("/")
def get_bands(user_id: int, db: Session = Depends(get_db)):
    return db.query(Band).filter(Band.user_id == user_id).all()

@router.put("/{band_id}")
def update_band(band_id: int, payload: BandUpdate, db: Session = Depends(get_db)):
    band = db.query(Band).filter(Band.id == band_id).first()
    if band is None:
        raise HTTPException(status_code=404, detail="Band not found")
    band.name = payload.name
    db.commit()
    db.refresh(band)
    return band


