from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import SessionLocal
from models import GigCreate, GigUpdate, Gig
router = APIRouter(prefix="/gigs", tags=["gigs"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_gigs(band_id: int, db: Session = Depends(get_db)):
    return db.query(Gig).filter(Gig.band_id == band_id).all()


@router.post("/")
def create_gig(gig_data: GigCreate, db: Session = Depends(get_db)):
    gig = Gig(
        band_id=gig_data.band_id,
        date_time=gig_data.date_time,
        venue=gig_data.venue,
        setlist_id=gig_data.setlist_id,
        pay=gig_data.pay,
        gig_duration=gig_data.gig_duration,
        notes=gig_data.notes,
    )
    db.add(gig)
    db.commit()
    db.refresh(gig)
    return gig


# --- Update a gig ---
@router.put("/{gig_id}")
def update_gig(gig_id: int, gig_data: GigUpdate, db: Session = Depends(get_db)):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    gig.date_time = gig_data.date_time
    gig.venue = gig_data.venue
    gig.setlist_id = gig_data.setlist_id
    gig.pay = gig_data.pay
    gig.gig_duration = gig_data.gig_duration
    gig.notes = gig_data.notes
    db.commit()
    db.refresh(gig)
    return gig


# --- Delete a gig ---
@router.delete("/{gig_id}")
def delete_gig(gig_id: int, db: Session = Depends(get_db)):
    gig = db.query(Gig).filter(Gig.id == gig_id).first()
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    db.delete(gig)
    db.commit()
    return {"ok": True}