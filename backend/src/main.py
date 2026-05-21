from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from models import Band

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get('/bands') # FastAPI will automatically convert this to a JSON response
def get_bands(db=Depends(get_db)):
    data = db.query(Band).all() # Query the database for all bands

    return

@app.post('/bands')
def create_band(band: Band, db=Depends(get_db)):
    db.add(band) # Add the new band to the database session
    db.commit() # Commit the transaction to save the band in the database
    db.refresh(band) # Refresh the instance to get the generated ID

    return band # Return the created band as a JSON response