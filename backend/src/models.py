from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel, ConfigDict

# ============================================================================
# ORM MODELS (SQLAlchemy) — these define DATABASE TABLES.
# Each class inherits from `Base` and each Column becomes a column in Postgres.
# Instances of these are rows. This is your persistent storage layer.
# ============================================================================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  # bcrypt hash; never returned by the API (UserOut omits it)

class Song(Base):
    __tablename__ = 'songs'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, index=True)
    key = Column(String, nullable=True)
    bpm = Column(Integer, nullable=True)
    duration = Column(String, nullable=True)  # stored as "3:45"
    notes = Column(String, nullable=True)
    band_id = Column(Integer, ForeignKey('bands.id'))
    added_at = Column(String, nullable=True) # ISO format timestamp as string
    last_played_at = Column(String, nullable=True) # ISO format timestamp as string (to Date), used to track song frequency for setlist suggestions

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
    position = Column(Integer, nullable=False) # can use SORT BY to order display of songs in setlist
    band_id = Column(Integer, ForeignKey('bands.id')) # Redundant but simplifies queries to have band_id here
    song = relationship("Song") # Establish relationship to Song for easier access to song details when fetching setlist songs

class Member(Base):
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
    setlist_id = Column(Integer, ForeignKey('setlists.id'), nullable=True) # optional association with a setlist
    pay = Column(Integer, nullable=True) # optional pay amount for the gig
    gig_duration = Column(String, nullable=True) # optional duration of the gig, stored as "HH:MM"
    notes = Column(String, nullable=True) # optional notes about the gig

class Band(Base):
    __tablename__ = 'bands'

    id = Column(Integer, primary_key=True, index=True)
    # index=True builds a database index on this column so lookups/filters on it
    # are fast (Postgres can jump straight to matching rows instead of scanning
    # the whole table). Worth it for columns you frequently query or filter by.
    name = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id')) # Associate band with a user
    # NOTE: member count is NOT stored here. The `members` table holds one row
    # per member, so the count is derived: SELECT COUNT(*) ... WHERE band_id = ?

# ============================================================================
# PYDANTIC SCHEMAS — these define API REQUEST/RESPONSE SHAPES, not tables.
# They validate incoming JSON (`*Create`) and control what JSON goes back out
# (`*Out`). They never touch the database directly.
# ============================================================================

class BandCreate(BaseModel):
    name: str
    user_id: int

class BandUpdate(BaseModel):
    # Only the name is editable. user_id is intentionally omitted — you don't
    # reassign a band to a different owner by renaming it.
    name: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str | None = None
    email: str | None = None

class SongCreate(BaseModel):
    title: str
    artist: str
    band_id: int
    key: str | None = None
    bpm: int | None = None
    duration: str | None = None  # stored as "3:45" string
    notes: str | None = None

class SetlistCreate(BaseModel):
    name: str
    band_id: int

class SetlistUpdate(BaseModel):
    # Only the name is editable for now. band_id is intentionally omitted —
    # you don't move a setlist between bands by renaming it.
    name: str

class SetlistSongCreate(BaseModel):
    song_id: int
    band_id: int

class SetlistReorder(BaseModel):
    # The full list of SetlistSong.id values in their NEW desired order.
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
    setlist_id: int | None = None # optional association with a setlist
    pay: int | None = None # optional pay amount for the gig
    gig_duration: str | None = None # optional duration of the gig, stored as "HH:MM"
    notes: str | None = None # optional notes about the gig

class GigUpdate(BaseModel):

    date_time: str | None = None # stored as "YYYY-MM-DD HH:MM"
    venue: str | None = None
    setlist_id: int | None = None # optional association with a setlist
    pay: int | None = None # optional pay amount for the gig
    gig_duration: str | None = None # optional duration of the gig, stored as "HH:MM"
    notes: str | None = None # optional notes about the gig
