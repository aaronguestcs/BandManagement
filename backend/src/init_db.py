"""
Initialize the database and create any missing tables.
Run from the backend/src directory: python init_db.py

Safe to run on every deploy — create_all only adds tables that don't
exist yet and never touches existing tables or data.
"""
import os
from pathlib import Path

# Load .env manually since we're running standalone (not through uvicorn)
env_path = Path(__file__).parent.parent.parent / ".env"
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

from sqlalchemy import create_engine, text

# Create the database itself first, connecting to the default 'postgres' db.
# AUTOCOMMIT is required — CREATE DATABASE can't run inside a transaction.
db_url = os.environ["DATABASE_URL"]
default_url = db_url.rsplit("/", 1)[0] + "/postgres"
admin_engine = create_engine(default_url, isolation_level="AUTOCOMMIT")
with admin_engine.connect() as conn:
    exists = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = 'band_app'")).fetchone()
    if not exists:
        conn.execute(text("CREATE DATABASE band_app"))
        print("Created database 'band_app'.")
    else:
        print("Database 'band_app' already exists.")
admin_engine.dispose()

from database import engine, Base
import models  # importing models registers them with Base so create_all knows about them

print("Creating any missing tables...")
Base.metadata.create_all(engine)

print("Done. Tables created:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
