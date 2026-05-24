from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Band, BandCreate

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


