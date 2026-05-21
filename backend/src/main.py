from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal
from models import Band
from routers.songs import router as songs_router

app = FastAPI()
app.include_router(songs_router)

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

# ADD ENDPOINTS
