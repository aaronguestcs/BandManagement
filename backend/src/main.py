from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.songs import router as songs_router
from routers.bands import router as bands_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(songs_router)
app.include_router(bands_router)
