from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from pydantic import BaseModel, ConfigDict

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

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

class Band(Base):
    __tablename__ = 'bands'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # What is index???
    members = Column(Integer, nullable=True) # Optional field to track number of members in the band, Change to array of Members later
    user_id = Column(Integer, ForeignKey('users.id')) # Associate band with a user

class BandCreate(BaseModel):
    name: str
    user_id: int

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

class SetlistSongCreate(BaseModel):
    song_id: int
    band_id: int

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