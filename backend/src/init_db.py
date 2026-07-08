"""
Initialize the database and create any missing tables.
Run from the backend/src directory: python init_db.py

Safe to run on every deploy — create_all only adds tables that don't
exist yet and never touches existing tables or data.
"""
import dotenv
# Loads .env locally if present; no-ops on Render where env vars are injected directly.
dotenv.load_dotenv()

from database import engine, Base
import models  # importing models registers them with Base so create_all knows about them

print("Creating any missing tables...")
Base.metadata.create_all(engine)

print("Done. Tables created:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
