from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.songs import router as songs_router
from routers.bands import router as bands_router
from routers.setlists import router as setlists_router
from routers.gigs import router as gigs_router
from routers.users import router as users_router
from routers.auth import router as auth_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Use regex to allow all subdomains of band-management.vercel.app and localhost with any port
    allow_origin_regex=r"https://band-management.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(songs_router)
app.include_router(bands_router)
app.include_router(setlists_router)
app.include_router(gigs_router)
app.include_router(users_router)
app.include_router(auth_router)
