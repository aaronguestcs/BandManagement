from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

class Band(Base):
    __tablename__ = 'bands'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    members = Column(Integer)
    user_id = Column(Integer, ForeignKey('users.id')) # Associate band with a user

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