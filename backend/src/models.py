"""
Contains all ORM models (SQLAlchemy) and all non-auth Pydantic schemas
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel, ConfigDict

# --- ORM Models (SQLAlchemy) ---

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  # bcrypt hash not returned to client

class Song(Base):
    __tablename__ = 'songs'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, index=True)
    key = Column(String, nullable=True)
    bpm = Column(Integer, nullable=True)
    duration = Column(String, nullable=True)  # stored as "M:SS"
    notes = Column(String, nullable=True)
    band_id = Column(Integer, ForeignKey('bands.id'))
    added_at = Column(String, nullable=True) # ISO format as string
    last_played_at = Column(String, nullable=True) # Currently unused, but could be used to track when a song was last played in a gig or setlist in the future.

class Setlist(Base):
    __tablename__ = 'setlists'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    band_id = Column(Integer, ForeignKey('bands.id'))

class SetlistSong(Base):
    __tablename__ = 'setlist_songs'

    id = Column(Integer, primary_key=True, index=True)
    setlist_id = Column(Integer, ForeignKey('setlists.id'), nullable=False)
    song_id = Column(Integer, ForeignKey('songs.id'), nullable=False)
    position = Column(Integer, nullable=False) # Position in a given setlist, indexing from 1.
    band_id = Column(Integer, ForeignKey('bands.id')) # Redundant but simplifies queries
    song = relationship("Song") # Establish relationship to Song for easier access to song details when fetching setlist songs

class Member(Base): # Currently unused, but could be used to track band members in the future.
    __tablename__ = 'members'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    instrument = Column(String, nullable=True)
    band_id = Column(Integer, ForeignKey('bands.id'))

class Gig(Base):
    __tablename__ = 'gigs'

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(String, index=True, nullable=False) # stored as "YYYY-MM-DD HH:MM"
    venue = Column(String, nullable=True)
    band_id = Column(Integer, ForeignKey('bands.id'))
    setlist_id = Column(Integer, ForeignKey('setlists.id'), nullable=True)
    pay = Column(Integer, nullable=True)
    gig_duration = Column(String, nullable=True) # stored as "HH:MM"
    notes = Column(String, nullable=True)

class Band(Base):
    __tablename__ = 'bands'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))

# --- Pydantic Schemas (for request/response validation) ---

class BandCreate(BaseModel):
    name: str
    user_id: int

class BandUpdate(BaseModel):
    name: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True) # Config for Pydantic model to read from ORM models

    id: int
    username: str | None = None
    email: str | None = None

class SongCreate(BaseModel):
    title: str
    artist: str
    band_id: int
    key: str | None = None
    bpm: int | None = None
    duration: str | None = None  # stored as "M:SS"
    notes: str | None = None

class SetlistCreate(BaseModel):
    name: str
    band_id: int

class SetlistUpdate(BaseModel):
    # Only used for setlist name -- setlist song changing is handled by the SetlistReorder class
    name: str

class SetlistSongCreate(BaseModel):
    song_id: int
    band_id: int

class SetlistReorder(BaseModel):
    # The full list of SetlistSong.id values in their new desired order.
    # The backend renumbers position from this array's ordering.
    ordered_ids: list[int]

class SongOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    artist: str
    key: str | None = None
    bpm: int | None = None
    duration: str | None = None
    notes: str | None = None

class SetlistSongOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    setlist_id: int
    song_id: int
    position: int
    band_id: int | None = None
    song: SongOut

class GigCreate(BaseModel):

    date_time: str | None = None # stored as "YYYY-MM-DD HH:MM"
    venue: str | None = None
    band_id: int
    setlist_id: int | None = None 
    pay: int | None = None 
    gig_duration: str | None = None # stored as "HH:MM"
    notes: str | None = None 

class GigUpdate(BaseModel):
    # Same as GigCreate but without band_id
    date_time: str | None = None # stored as "YYYY-MM-DD HH:MM"
    venue: str | None = None
    setlist_id: int | None = None 
    pay: int | None = None
    gig_duration: str | None = None 
    notes: str | None = None 
